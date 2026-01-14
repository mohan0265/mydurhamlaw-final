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
    // Strategy: Try to create user first, catch 'already exists', then link by email from RPC
    let lovedUserId: string | null = null;
    let isNewUser = false;
    
    // First, try to create the user
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
    
    if (authError) {
      // Check if user already exists
      if (authError.message.includes('already been registered') || 
          authError.message.includes('already exists') ||
          authError.message.includes('duplicate')) {
        // User exists - get their ID via RPC or fallback
        console.log(`[create-loved-one] User ${email} already exists, looking up ID`);
        
        // Use RPC to get user ID by email (we'll create this function if it doesn't exist)
        const { data: userData, error: rpcError } = await adminClient.rpc('get_user_id_by_email', {
          p_email: email
        });
        
        if (rpcError || !userData) {
          // RPC doesn't exist or failed - try via inviteUserByEmail as a hack to get ID
          // Actually, let's just try to use a direct SQL query as service role
          const { data: sqlData } = await adminClient
            .from('profiles')
            .select('id')
            .limit(1);
          
          // Fallback: Create the connection with email only, the loved one will link on first login
          console.log(`[create-loved-one] Cannot lookup existing user ID - will use email-based connection`);
          // We'll set loved_user_id to null and use loved_email to match on login
          lovedUserId = null;
        } else {
          lovedUserId = userData as string;
          console.log(`[create-loved-one] Found existing user ID via RPC: ${lovedUserId}`);
        }
      } else {
        // Different error - return it
        return res.status(400).json({ error: authError.message });
      }
    } else if (authData?.user) {
      // Successfully created new user
      lovedUserId = authData.user.id;
      isNewUser = true;
      console.log(`[create-loved-one] Created new auth user ${email} (${lovedUserId})`);
      
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
        await adminClient.auth.admin.deleteUser(lovedUserId);
        return res.status(400).json({ error: profileError.message });
      }
    }
    
    // If we have a lovedUserId, update their profile role
    if (lovedUserId && !isNewUser) {
      await adminClient
        .from('profiles')
        .upsert({
          id: lovedUserId,
          display_name: actualDisplayName,
          user_role: 'loved_one',
        }, { onConflict: 'id', ignoreDuplicates: false });
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

