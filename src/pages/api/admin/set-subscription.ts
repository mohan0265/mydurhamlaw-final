// API Route: Set Subscription Status
import type { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'cookie';
import { createHmac } from 'crypto';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import type { SubscriptionStatus } from '@/types/admin';

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

  const { userId, status, endsAt } = req.body;

  if (!userId || !status) {
    return res.status(400).json({ error: 'Missing userId or status' });
  }

  const validStatuses: SubscriptionStatus[] = ['trial', 'active', 'inactive', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid subscription status' });
  }

  try {
    const updateData: any = {
      subscription_status: status,
    };

    if (endsAt) {
      updateData.subscription_ends_at = endsAt;
    }

    const { error: updateError } = await adminClient
      .from('profiles')
      .update(updateData)
      .eq('user_id', userId);

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    return res.status(200).json({ 
      success: true, 
      status,
      endsAt: endsAt || null 
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
