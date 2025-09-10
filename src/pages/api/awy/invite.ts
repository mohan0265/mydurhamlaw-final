import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/server/supabaseAdmin';

/**
 * POST /api/awy/invite
 * headers:  x-user-id: <student_id>
 * body: { email: string, relationship: string }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });

  try {
    const studentId = (req.headers['x-user-id'] as string) || '';
    const { email, relationship } = req.body || {};

    if (!studentId) return res.status(401).json({ ok: false, error: 'unauthenticated' });
    if (!email || !relationship) return res.status(400).json({ ok: false, error: 'invalid_request' });

    // Create an auth user as loved_one (they'll get email invite)
    const invite = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { role: 'loved_one' }
      // redirectTo: optional magic-link redirect URL
    });
    if (invite.error) throw invite.error;

    const lovedId = invite.data?.user?.id || null;

    // If user object already existed, lovedId will be set; if not, record stays pending
    await supabaseAdmin.from('awy_connections').upsert({
      student_id: studentId,
      loved_one_id: lovedId,
      loved_email: email,
      relationship,
      status: lovedId ? 'active' : 'pending',
      is_visible: true,
    }, { onConflict: 'student_id,loved_email' });

    return res.status(200).json({ ok: true, userId: lovedId, status: lovedId ? 'active' : 'pending' });
  } catch (err: any) {
    console.error('[awy/invite] error', err);
    return res.status(500).json({ ok: false, error: err?.message || 'server_error' });
  }
}
