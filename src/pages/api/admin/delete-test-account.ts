// API Route: Delete Test Account (Safety: only deletes if is_test_account = true)
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

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  try {
    // SAFETY CHECK: Only delete if is_test_account = true
    const { data: profile, error: fetchError } = await adminClient
      .from('profiles')
      .select('is_test_account, user_role')
      .eq('user_id', userId)
      .single();

    if (fetchError || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (!profile.is_test_account) {
      return res.status(403).json({ error: 'Cannot delete non-test account. Safety check failed.' });
    }

    // Delete AWY connections (both as student and loved one)
    await adminClient
      .from('awy_connections')
      .delete()
      .or(`student_user_id.eq.${userId},loved_user_id.eq.${userId}`);

    // Delete profile
    await adminClient
      .from('profiles')
      .delete()
      .eq('user_id', userId);

    // Delete auth user
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      return res.status(400).json({ error: authDeleteError.message });
    }

    return res.status(200).json({ success: true, deletedUserId: userId });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
