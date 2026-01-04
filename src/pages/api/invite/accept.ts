import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { getServerUser } from '@/lib/api/serverAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Missing invite token' });
  }

  // Get authenticated user (must have just completed Google OAuth)
  const { user } = await getServerUser(req, res);
  if (!user || !user.email) {
    return res.status(401).json({ error: 'Not authenticated. Please sign in with Google first.' });
  }

  const adminClient = getSupabaseAdmin();
  if (!adminClient) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  try {
    // 1. Fetch and validate invitation
    const { data: invitation, error: fetchError } = await adminClient
      .from('student_invitations')
      .select('*')
      .eq('invite_token', token)
      .single();

    if (fetchError || !invitation) {
      return res.status(404).json({ error: 'Invalid invitation' });
    }

    // Check status
    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: `Invitation is ${invitation.status}` });
    }

    // Check expiration
    if (new Date(invitation.expires_at) < new Date()) {
      await adminClient
        .from('student_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    // Verify email matches
    if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
      return res.status(403).json({ 
        error: `This invitation is for ${invitation.email}. You signed in as ${user.email}.` 
      });
    }

    // 2. Calculate trial end date
    const now = new Date();
    const trialEnds = new Date(now.getTime() + invitation.trial_days * 24 * 60 * 60 * 1000);

    // 3. Create or update profile with trial period
    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert({
        id: user.id,
        display_name: invitation.display_name,
        user_role: 'student',
        year_group: invitation.year_group,
        year_of_study: invitation.year_group,
        is_test_account: true,
        trial_started_at: now.toISOString(),
        trial_ends_at: trialEnds.toISOString(),
        trial_ever_used: true,
        subscription_status: 'trial',
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return res.status(500).json({ error: 'Failed to create profile' });
    }

    // 4. Mark invitation as accepted
    await adminClient
      .from('student_invitations')
      .update({
        status: 'accepted',
        accepted_at: now.toISOString(),
        user_id: user.id,
      })
      .eq('id', invitation.id);

    return res.status(200).json({
      success: true,
      userId: user.id,
      email: user.email,
      displayName: invitation.display_name,
      yearGroup: invitation.year_group,
      trialEndsAt: trialEnds.toISOString(),
    });

  } catch (error: any) {
    console.error('Accept invite error:', error);
    return res.status(500).json({ error: error.message || 'Failed to accept invitation' });
  }
}
