// src/pages/api/admin/delete-invitation.ts
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

/**
 * API Route: Delete Student Invitation
 * 
 * Allows admins to remove pending invitations from the dashboard.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check admin auth
  const token = parse(req.headers.cookie || '')[COOKIE_NAME];
  const exp = expectedToken();
  if (!token || !exp || token !== exp) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const adminClient = getSupabaseAdmin();
  if (!adminClient) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  const { invitationId } = req.body;

  if (!invitationId) {
    return res.status(400).json({ error: 'Missing invitationId' });
  }

  try {
    // Delete from student_invitations table
    const { error } = await adminClient
      .from('student_invitations')
      .delete()
      .eq('id', invitationId);

    if (error) {
       console.error('Delete invite error:', error);
       return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ success: true, deletedInvitationId: invitationId });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
