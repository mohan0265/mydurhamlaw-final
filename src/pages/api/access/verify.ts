import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { isAllowedDomain, isTrialValid } from '@/lib/access/config';
import type { AccessDenialReason } from '@/lib/access/config';

/**
 * Access Verification Endpoint
 * 
 * Server-side access check using service-role key to bypass RLS
 * 
 * Returns:
 * {
 *   allowed: boolean,
 *   reason?: 'domain_not_allowed' | 'not_in_allowlist' | 'trial_expired' | 'account_blocked' | 'unknown',
 *   email?: string,
 *   role?: 'student' | 'admin',
 *   trialExpiresAt?: string | null
 * }
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. GET USER SESSION
    const supabase = createPagesServerClient({ req, res });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user || !user.email) {
      return res.status(200).json({ 
        allowed: false, 
        reason: 'not_in_allowlist' as AccessDenialReason 
      });
    }

    const email = user.email.toLowerCase().trim();

    // 2. CHECK ALLOWLIST USING SERVICE-ROLE KEY (bypasses RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: allowlistEntry, error: dbError } = await supabaseAdmin
      .from('access_allowlist')
      .select('email, status, role, trial_expires_at')
      .eq('email', email)
      .maybeSingle();

    if (dbError) {
      console.error('[ACCESS CHECK] Database error:', dbError);
      return res.status(200).json({ 
        allowed: false, 
        reason: 'unknown' as AccessDenialReason,
        email 
      });
    }

    if (!allowlistEntry) {
      console.log(`[ACCESS DENIED] Email not in allowlist: ${email}`);
      return res.status(200).json({ 
        allowed: false, 
        reason: 'not_in_allowlist' as AccessDenialReason,
        email 
      });
    }

    // 3. CHECK DOMAIN (only for non-admin users)
    // Admins can have ANY email domain (e.g., mohan0265@gmail.com)
    if (allowlistEntry.role !== 'admin' && !isAllowedDomain(email)) {
      console.log(`[ACCESS DENIED] Domain not allowed for student: ${email}`);
      return res.status(200).json({ 
        allowed: false, 
        reason: 'domain_not_allowed' as AccessDenialReason,
        email 
      });
    }

    // 4. CHECK STATUS
    if (allowlistEntry.status !== 'active') {
      console.log(`[ACCESS DENIED] Account blocked: ${email}`);
      return res.status(200).json({ 
        allowed: false, 
        reason: 'account_blocked' as AccessDenialReason,
        email 
      });
    }

    // 5. CHECK TRIAL EXPIRY
    if (!isTrialValid(allowlistEntry.trial_expires_at)) {
      console.log(`[ACCESS DENIED] Trial expired: ${email}`);
      return res.status(200).json({ 
        allowed: false, 
        reason: 'trial_expired' as AccessDenialReason,
        email,
        trialExpiresAt: allowlistEntry.trial_expires_at 
      });
    }

    // ALL CHECKS PASSED
    console.log(`[ACCESS GRANTED] ${email} (${allowlistEntry.role})`);
    return res.status(200).json({
      allowed: true,
      email,
      role: allowlistEntry.role as 'student' | 'admin',
      trialExpiresAt: allowlistEntry.trial_expires_at,
    });

  } catch (error: any) {
    console.error('[ACCESS CHECK] Unexpected error:', error);
    return res.status(200).json({ 
      allowed: false, 
      reason: 'unknown' as AccessDenialReason 
    });
  }
}
