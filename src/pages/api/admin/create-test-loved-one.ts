// API Route: Create Test Loved One Account (or link existing account)
import type { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'cookie';
import { createHmac, randomBytes } from 'crypto';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import type { CreateTestLovedOneRequest, CreateTestLovedOneResponse } from '@/types/admin';

const COOKIE_NAME = 'admin_session';

function expectedToken() {
  const adminUser = process.env.ADMIN_USERNAME;
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminUser || !adminPass) return null;
  return createHmac('sha256', adminPass).update(adminUser).digest('hex');
}

// Generate a valid fake email for non-email test IDs
function generateTestEmail(identifier: string): string {
  const slug = identifier
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30);
  const random = randomBytes(4).toString('hex');
  return `${slug}_${random}@test.mydurhamlaw.local`;
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

  const { email: inputIdentifier, displayName, studentUserId, relationship, nickname, password }: CreateTestLovedOneRequest = req.body;

  if (!inputIdentifier || !displayName || !studentUserId || !relationship) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Support non-email identifiers by auto-generating fake email
  const isRealEmail = inputIdentifier.includes('@');
  const email = isRealEmail ? inputIdentifier : generateTestEmail(inputIdentifier);
  const actualDisplayName = displayName || inputIdentifier;

  try {
    // Strategy: First check if user exists via RPC, then create only if needed
    let lovedUserId: string | null = null;
    let isNewUser = false;
    
    // 1. Check if user already exists using our RPC function
    console.log(`[create-loved-one] Checking if ${email} already exists...`);
    const { data: existingUserId, error: rpcError } = await adminClient.rpc('get_user_id_by_email', {
      p_email: email
    });
    
    if (existingUserId) {
      // User already exists - use their ID
      lovedUserId = existingUserId as string;
      console.log(`[create-loved-one] Found existing user: ${lovedUserId}`);
      
      // Update their profile to ensure loved_one role is set
      await adminClient
        .from('profiles')
        .upsert({
          id: lovedUserId,
          display_name: actualDisplayName,
          user_role: 'loved_one',
        }, { onConflict: 'id', ignoreDuplicates: false });
    } else {
      // User doesn't exist - create new auth user
      console.log(`[create-loved-one] No existing user, creating new account for ${email}`);
      
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password: password || 'TestPass123!',
        email_confirm: true,
        user_metadata: {
          display_name: actualDisplayName,
          is_test_account: true,
          original_identifier: inputIdentifier,
        },
      });
      
      if (authError || !authData?.user) {
        console.error('[create-loved-one] createUser failed:', authError?.message);
        return res.status(400).json({ error: authError?.message || 'Failed to create auth user' });
      }
      
      lovedUserId = authData.user.id;
      isNewUser = true;
      console.log(`[create-loved-one] Created new auth user: ${lovedUserId}`);
      
      // Create profile for new user
      const { error: profileError } = await adminClient
        .from('profiles')
        .insert({
          id: lovedUserId,
          display_name: actualDisplayName,
          user_role: 'loved_one',
          is_test_account: true,
        });

      if (profileError) {
        // Rollback auth user if profile creation fails
        await adminClient.auth.admin.deleteUser(lovedUserId);
        return res.status(400).json({ error: profileError.message });
      }
    }

    // 2. Create AWY connection (allows same loved one to connect to multiple students)
    const { data: connectionData, error: connectionError } = await adminClient
      .from('awy_connections')
      .insert({
        student_user_id: studentUserId,
        student_id: studentUserId,
        loved_user_id: lovedUserId,
        loved_one_id: lovedUserId,
        email: email,
        loved_email: email,
        relationship,
        nickname: nickname || actualDisplayName,
        status: 'granted',
        invited_at: new Date().toISOString(),
        accepted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (connectionError) {
      // Rollback if new user was created
      if (isNewUser) {
        await adminClient.from('profiles').delete().eq('id', lovedUserId);
        await adminClient.auth.admin.deleteUser(lovedUserId);
      }
      return res.status(400).json({ error: connectionError.message });
    }

    const response: CreateTestLovedOneResponse = {
      userId: lovedUserId,
      profileId: lovedUserId,
      connectionId: connectionData.id,
      status: 'granted',
      email,
    };

    return res.status(200).json({
      ...response,
      message: isNewUser 
        ? `Created new loved one account: ${email}`
        : `Linked existing user ${email} as loved one`
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

