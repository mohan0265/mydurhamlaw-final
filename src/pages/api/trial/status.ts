import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user from session/auth
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    // Extract user ID from session (simplified - in production you'd verify JWT)
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    // Get user profile with trial info
    if (!supabase) {
      console.error('Supabase client is not available.');
      return res.status(500).json({ error: 'Database connection unavailable' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('primary_year, trial_started_at, trial_expires_at')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Calculate trial status
    const now = new Date();
    const trialExpiresAt = profile.trial_expires_at ? new Date(profile.trial_expires_at) : null;
    const trialActive = trialExpiresAt ? now < trialExpiresAt : false;
    
    const daysLeft = trialExpiresAt 
      ? Math.max(0, Math.ceil((trialExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    // Get trial personas
    const { data: personas, error: personasError } = await supabase
      .from('trial_personas')
      .select('year_group')
      .eq('user_id', userId);

    if (personasError) {
      return res.status(500).json({ error: 'Failed to fetch trial personas' });
    }

    // Get active preview year from session/cookie if any
    const activePreviewYear = req.cookies.preview_year || null;

    return res.status(200).json({
      trialActive,
      daysLeft,
      primaryYear: profile.primary_year,
      activePreviewYear: trialActive ? activePreviewYear : null,
      personas: personas?.map(p => p.year_group) || []
    });

  } catch (error) {
    console.error('Trial status error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}