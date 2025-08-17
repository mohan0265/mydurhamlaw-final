import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase/client';
import { withRateLimit } from '@/lib/middleware/rateLimiter';

async function personaHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { year_group } = req.body;

  if (!year_group || !['foundation', 'year1', 'year2', 'year3'].includes(year_group)) {
    return res.status(400).json({ error: 'Valid year_group required' });
  }

  try {
    // Get user from session/auth
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    // Check if trial is active
    if (!supabase) {
      console.error('Supabase client is not available.');
      return res.status(500).json({ error: 'Database connection unavailable' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('trial_expires_at')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const now = new Date();
    const trialExpiresAt = profile.trial_expires_at ? new Date(profile.trial_expires_at) : null;
    const trialActive = trialExpiresAt ? now < trialExpiresAt : false;

    if (!trialActive) {
      return res.status(403).json({ error: 'Trial has expired' });
    }

    // Upsert trial persona (idempotent)
    const { data, error } = await supabase
      .from('trial_personas')
      .upsert(
        { user_id: userId, year_group },
        { 
          onConflict: 'user_id,year_group',
          ignoreDuplicates: false 
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Persona creation error:', error);
      return res.status(500).json({ error: 'Failed to create persona' });
    }

    return res.status(200).json({
      success: true,
      persona: data,
      selectedPreviewYear: year_group
    });

  } catch (error) {
    console.error('Persona API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withRateLimit(personaHandler, {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 requests per minute
  message: 'Too many persona requests. Please wait.'
});