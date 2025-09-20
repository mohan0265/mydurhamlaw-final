import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerUser } from '@/lib/api/serverAuth';

const ok = (res: NextApiResponse, body: Record<string, unknown> = {}) =>
  res.status(200).json({ ok: true, ...body });

const failSoft = (
  res: NextApiResponse,
  message: string,
  extra: Record<string, unknown> = {}
) => {
  console.warn('[awy/connections] soft-fail:', message);
  return res.status(200).json({ ok: false, error: message, ...extra });
};

type NormalizedConnection = {
  id: string;
  email: string;
  relationship: string | null;
  display_name: string | null;
  status: string | null;
  peer_id?: string | null;
};

function normalizeRow(row: any, names: Record<string, string>, currentUserId: string): NormalizedConnection {
  const peerId = row.student_id === currentUserId ? row.loved_one_id : row.student_id;
  return {
    id: String(row.id ?? `${row.loved_email ?? row.email ?? 'unknown'}`),
    email: typeof row.loved_email === 'string' ? row.loved_email.toLowerCase() : String(row.email || '').toLowerCase(),
    relationship: row.relationship_label ?? row.relationship ?? null,
    display_name: peerId ? names[peerId] || null : null,
    status: row.status ?? null,
    peer_id: peerId ?? null,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user, supabase } = await getServerUser(req, res);

  if (!user || !supabase) {
    if (req.method === 'GET') {
      return ok(res, { connections: [], userRole: 'guest' });
    }
    return failSoft(res, 'unauthenticated');
  }

  const userId = user.id;

  if (req.method === 'GET') {
    let userRole: 'student' | 'loved_one' | 'guest' = 'guest';

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_role')
        .eq('id', userId)
        .maybeSingle();

      if (!profileError && profile?.user_role) {
        const role = String(profile.user_role);
        if (role === 'student' || role === 'loved_one') {
          userRole = role;
        }
      }
    } catch (err: any) {
      console.warn('[awy/connections] profile lookup failed:', err?.message || err);
    }

    try {
      let query = supabase
        .from('awy_connections')
        .select('id, student_id, loved_one_id, loved_email, relationship_label, relationship, status, is_visible, created_at')
        .eq('is_visible', true);

      if (userRole === 'student') {
        query = query.eq('student_id', userId);
      } else if (userRole === 'loved_one') {
        query = query.eq('loved_one_id', userId);
      } else {
        query = query.or(`student_id.eq.${userId},loved_one_id.eq.${userId}`);
      }

      const { data: rows, error } = await query.order('created_at', { ascending: false });
      if (error) {
        throw error;
      }

      const records = rows ?? [];

      const peerIds = Array.from(
        new Set(
          records
            .map((row: any) => (row.student_id === userId ? row.loved_one_id : row.student_id))
            .filter((value: unknown): value is string => typeof value === 'string' && value.length > 0)
        )
      );

      const names: Record<string, string> = {};
      if (peerIds.length > 0) {
        try {
          const { data: peers, error: peerError } = await supabase
            .from('profiles')
            .select('id, display_name')
            .in('id', peerIds);

          if (peerError) {
            throw peerError;
          }

          (peers ?? []).forEach((peer: any) => {
            if (peer?.id) {
              names[peer.id] = peer.display_name || '';
            }
          });
        } catch (err: any) {
          console.warn('[awy/connections] name enrichment skipped:', err?.message || err);
        }
      }

      const connections = records.map((row: any) => normalizeRow(row, names, userId));
      if (userRole === 'guest') {
        userRole = 'student';
      }
      return ok(res, { connections, userRole });
    } catch (err: any) {
      console.warn('[awy/connections] load failed:', err?.message || err);
      return ok(res, { connections: [], userRole });
    }
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const rawEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const relationship = typeof body.relationship === 'string' ? body.relationship.trim() : '';
    const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : '';

    if (!rawEmail) {
      return failSoft(res, 'invalid_email');
    }

    const payload = {
      student_id: userId,
      loved_email: rawEmail,
      relationship: relationship || null,
      display_name: displayName || null,
      status: 'active',
      is_visible: true,
      updated_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase
        .from('awy_connections')
        .upsert(payload, { onConflict: 'student_id,loved_email' });

      if (error) {
        throw error;
      }

      return ok(res, { saved: true });
    } catch (err: any) {
      const message = err?.message || 'save_failed';
      if (message.toLowerCase().includes('relation') || message.toLowerCase().includes('does not exist')) {
        return failSoft(res, 'table-missing');
      }
      return failSoft(res, message);
    }
  }

  if (req.method === 'DELETE') {
    const { id } = (req.body || {}) as { id?: string };
    if (!id) {
      return failSoft(res, 'missing_id');
    }

    try {
      const { error } = await supabase.from('awy_connections').delete().eq('id', id);
      if (error) {
        throw error;
      }
      return ok(res, {});
    } catch (err: any) {
      return failSoft(res, err?.message || 'delete_failed');
    }
  }

  return failSoft(res, 'method_not_allowed');
}
