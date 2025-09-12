// src/pages/api/awy/invite.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerUser } from '@/lib/api/serverAuth'; // cookie-first + Bearer token fallback
import { supabaseAdmin } from '@/lib/server/supabaseAdmin';

/**
 * POST /api/awy/invite
 * headers (optional fallback):  x-user-id: <student_id>
 * body: { email: string, relationship: string }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  try {
    // Auth: try cookie-based first, then Authorization: Bearer <token>.
    // If that fails, fall back to your existing x-user-id header.
    const { user } = await getServerUser(req, res);
    const headerUserId = (req.headers['x-user-id'] as string) || '';
    const studentId = user?.id || headerUserId;

    const { email, relationship } = (req.body as { email?: string; relationship?: string }) || {};

    if (!studentId) return res.status(401).json({ ok: false, error: 'unauthenticated' });
    if (!email || !relationship) return res.status(400).json({ ok: false, error: 'invalid_request' });

    // Create or invite the loved one
    const invite = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { role: 'loved_one' },
      // redirectTo: you can add a magic-link redirect URL here if desired
    });

    if (invite.error) throw invite.error;

    const lovedId = invite.data?.user?.id || null;

    // Upsert the connection; if the user already exists, mark as active, else pending.
    const { error: upsertError } = await supabaseAdmin
      .from('awy_connections')
      .upsert(
        {
          student_id: studentId,
          loved_one_id: lovedId,
          loved_email: email,
          relationship,
          status: lovedId ? 'active' : 'pending',
          is_visible: true,
        },
        { onConflict: 'student_id,loved_email' }
      );

    if (upsertError) throw upsertError;

    return res
      .status(200)
      .json({ ok: true, userId: lovedId, status: lovedId ? 'active' : 'pending' });
  } catch (err: any) {
    console.error('[awy/invite] error', err);
    return res.status(500).json({ ok: false, error: err?.message || 'server_error' });
  }
}
