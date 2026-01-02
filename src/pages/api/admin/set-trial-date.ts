// API Route: Set Exact Trial End Date
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

  const { userId, trialEndsAt } = req.body;

  if (!userId || !trialEndsAt) {
    return res.status(400).json({ error: 'Missing userId or trialEndsAt' });
  }

  // Validate date format
  const date = new Date(trialEndsAt);
  if (isNaN(date.getTime())) {
    return res.status(400).json({ error: 'Invalid date format' });
  }

  try {
    // Update profile with exact date
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({
        trial_ends_at: date.toISOString(),
        trial_ever_used: true,
        trial_started_at: new Date().toISOString(), // Ensure trial_started_at is set
      })
      .eq('user_id', userId);

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    return res.status(200).json({ 
      success: true, 
      trialEndsAt: date.toISOString()
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
