import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

/**
 * Complete Onboarding API
 * 
 * Called after OAuth callback to save student profile + consent
 * Input: displayName, yearGroup, acceptedAt, termsVersion, privacyVersion
 * Output: success boolean
 * 
 * Security: Requires authenticated session
 */

interface OnboardingRequest {
  displayName: string;
  yearGroup: string;
  acceptedAt: string; // ISO timestamp
  termsVersion: string;
  privacyVersion: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. VERIFY AUTHENTICATION
    const supabase = createPagesServerClient({ req, res });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user || !user.email) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // 2. VALIDATE INPUT
    const { displayName, yearGroup, acceptedAt, termsVersion, privacyVersion } = req.body as OnboardingRequest;

    if (!displayName?.trim()) {
      return res.status(400).json({ error: 'Display name is required' });
    }

    const validYears = ['Foundation', 'Year 1', 'Year 2', 'Year 3'];
    if (!validYears.includes(yearGroup)) {
      return res.status(400).json({ error: 'Invalid year group' });
    }

    if (!acceptedAt) {
      return res.status(400).json({ error: 'Consent timestamp required' });
    }

    // 3. UPSERT PROFILE (using service-role for RLS bypass)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email.toLowerCase(),
        display_name: displayName.trim(),
        year_group: yearGroup,
        accepted_terms_at: acceptedAt,
        accepted_privacy_at: acceptedAt,
        terms_version: termsVersion || 'v1',
        privacy_version: privacyVersion || 'v1',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (profileError) {
      console.error('[ONBOARDING] Profile upsert failed:', profileError);
      return res.status(500).json({ error: 'Failed to save profile' });
    }

    console.log(`[ONBOARDING] Profile completed for ${user.email}: ${displayName} (${yearGroup})`);

    return res.status(200).json({ 
      success: true,
      profile: {
        displayName: profile.display_name,
        yearGroup: profile.year_group
      }
    });

  } catch (error: any) {
    console.error('[ONBOARDING] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
