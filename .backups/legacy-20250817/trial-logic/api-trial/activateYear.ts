import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
      .select('trial_expires_at, primary_year')
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

    // Set preview year cookie (expires when trial ends)
    const cookieExpires = trialExpiresAt ? trialExpiresAt.toUTCString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
    
    res.setHeader('Set-Cookie', `preview_year=${year_group}; Path=/; HttpOnly; SameSite=Lax; Expires=${cookieExpires}`);

    return res.status(200).json({
      success: true,
      activeYear: year_group,
      primaryYear: profile.primary_year,
      message: `Activated preview for ${year_group}`
    });

  } catch (error) {
    console.error('Activate year error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}