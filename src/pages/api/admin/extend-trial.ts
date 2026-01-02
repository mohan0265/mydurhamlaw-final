// API Route: Extend Trial Period
import type { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'cookie';
import { createHmac } from 'crypto';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';

const COOKIE_NAME = 'admin_session';

function expectedToken() {
  const adminUser = process.env.ADMIN_USERNAME;
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminUser || !adminPass) return null;
  return createHmac('sha256', adminPass).update(adminUser).digest('hex');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = parse(req.headers.cookie || '')[COOKIE_NAME];
  const exp = expectedToken();
  if (!token || !exp || token !== exp) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const adminClient = getSupabaseAdmin();
  if (!adminClient) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  const { userId, extensionDays } = req.body;

  if (!userId || !extensionDays) {
    return res.status(400).json({ error: 'Missing userId or extensionDays' });
  }

  try {
    // Get current profile
    const { data: profile, error: fetchError } = await adminClient
      .from('profiles')
      .select('trial_ends_at, trial_started_at')
      .eq('user_id', userId)
      .single();

    if (fetchError || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Calculate new trial end date
    const currentEnd = profile.trial_ends_at ? new Date(profile.trial_ends_at) : new Date();
    const newEnd = new Date(currentEnd.getTime() + extensionDays * 24 * 60 * 60 * 1000);

    // Update profile
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({
        trial_ends_at: newEnd.toISOString(),
        trial_ever_used: true,
        trial_started_at: profile.trial_started_at || new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    return res.status(200).json({ 
      success: true, 
      newTrialEndsAt: newEnd.toISOString(),
      extensionDays 
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
