// API Route: Create Test Loved One Account
import type { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'cookie';
import { createHmac } from 'crypto';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import type { CreateTestLovedOneRequest, CreateTestLovedOneResponse } from '@/types/admin';

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

  const { email, displayName, studentUserId, relationship, nickname, password }: CreateTestLovedOneRequest = req.body;

  if (!email || !displayName || !studentUserId || !relationship) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Create auth user for loved one
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password: password || 'TestPass123!',
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
      },
    });

    if (authError || !authData.user) {
      return res.status(400).json({ error: authError?.message || 'Failed to create auth user' });
    }

    const lovedUserId = authData.user.id;

    // 2. Create loved one profile (email is in auth.users, not profiles!)
    const { data: profileData, error: profileError } = await adminClient
      .from('profiles')
      .insert({
        user_id: lovedUserId,
        display_name: displayName,
        // REMOVED: email (not a column in profiles table!)
        user_role: 'loved_one',
        is_test_account: true,
      })
      .select()
      .single();

    if (profileError) {
      await adminClient.auth.admin.deleteUser(lovedUserId);
      return res.status(400).json({ error: profileError.message });
    }

    // 3. Create AWY connection
    const { data: connectionData, error: connectionError } = await adminClient
      .from('awy_connections')
      .insert({
        student_user_id: studentUserId,
        loved_user_id: lovedUserId,
        loved_email: email,
        relationship,
        nickname: nickname || displayName,
        status: 'granted',
      })
      .select()
      .single();

    if (connectionError) {
      // Rollback
      await adminClient.from('profiles').delete().eq('user_id', lovedUserId);
      await adminClient.auth.admin.deleteUser(lovedUserId);
      return res.status(400).json({ error: connectionError.message });
    }

    const response: CreateTestLovedOneResponse = {
      userId: lovedUserId,
      profileId: profileData.id,
      connectionId: connectionData.id,
      status: 'granted',
    };

    return res.status(200).json(response);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
