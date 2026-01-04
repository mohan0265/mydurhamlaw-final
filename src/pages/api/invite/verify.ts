import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Missing invite token' });
  }

  const adminClient = getSupabaseAdmin();
  if (!adminClient) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  try {
    // Fetch invitation by token
    const { data: invitation, error } = await adminClient
      .from('student_invitations')
      .select('*')
      .eq('invite_token', token)
      .single();

    if (error || !invitation) {
      return res.status(404).json({ 
        valid: false,
        error: 'Invalid or expired invitation' 
      });
    }

    // Check if already accepted
    if (invitation.status === 'accepted') {
      return res.status(400).json({ 
        valid: false,
        error: 'This invitation has already been used' 
      });
    }

    // Check if expired
    if (invitation.status === 'expired' || new Date(invitation.expires_at) < new Date()) {
      // Mark as expired if not already
      if (invitation.status !== 'expired') {
        await adminClient
          .from('student_invitations')
          .update({ status: 'expired' })
          .eq('id', invitation.id);
      }
      
      return res.status(400).json({ 
        valid: false,
        error: 'This invitation has expired' 
      });
    }

    // Valid invitation
    return res.status(200).json({
      valid: true,
      email: invitation.email,
      displayName: invitation.display_name,
      yearGroup: invitation.year_group,
      trialDays: invitation.trial_days,
      expiresAt: invitation.expires_at,
    });

  } catch (error: any) {
    console.error('Verify invite error:', error);
    return res.status(500).json({ error: 'Failed to verify invitation' });
  }
}
