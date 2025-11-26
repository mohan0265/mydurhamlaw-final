import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUser } from '@/lib/server/auth';

type ConnectionRow = {
  id: string;
  student_id: string;
  loved_email: string;
  display_name: string | null;
  relationship: string | null;
  status: 'active' | 'pending' | 'blocked' | null;
  is_visible: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  loved_one_id?: string | null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }

  const got = await requireUser(req, res);
  if (!got) {
    console.debug('[AWY] requireUser: unauthenticated (connections)');
    return;
  }

  const { user, supabase } = got;

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('awy_connections')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[AWY GET] connections soft-fail:', error);
        return res.status(200).json({ ok: true, connections: [] });
      }

      const list = (data ?? []).map((row) => ({
        ...row,
        loved_email: String(row.loved_email || '').toLowerCase(),
      }));

      return res.status(200).json({ ok: true, connections: list });
    }

    if (req.method === 'POST') {
      const { email, display_name, relationship } = (req.body ?? {}) as {
        email?: string;
        display_name?: string;
        relationship?: string;
      };

      const lovedEmail = String(email ?? '').trim().toLowerCase();
      if (!lovedEmail) {
        return res.status(400).json({ ok: false, error: 'missing_email' });
      }

      const payload = {
        student_id: user.id,
        loved_email: lovedEmail,
        display_name: display_name?.trim() || null,
        relationship: relationship?.trim() || null,
        status: 'active' as const,
        is_visible: true,
      };

      const { error } = await supabase
        .from('awy_connections')
        .upsert(payload, { onConflict: 'student_id,loved_email' });

      if (error) {
        console.warn('[AWY POST] connections soft-fail:', error);
        return res.status(200).json({ ok: true });
      }

      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const { id } = (req.body ?? {}) as { id?: string };
      if (!id) {
        return res.status(400).json({ ok: false, error: 'missing_id' });
      }

      const { error } = await supabase
        .from('awy_connections')
        .delete()
        .eq('id', id)
        .eq('student_id', user.id);

      if (error) {
        console.warn('[AWY DELETE] connections error:', error);
        return res.status(500).json({ ok: false, error: 'server_error' });
      }

      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET,POST,DELETE,OPTIONS');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  } catch (err) {
    console.error('[AWY handler] fatal:', err);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
}
