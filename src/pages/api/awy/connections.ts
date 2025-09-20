import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerUser, softOk } from '@/lib/server/auth';

type Conn = {
  id: string;
  loved_email: string;
  relationship: string | null;
  display_name: string | null;
  status: string | null;
  is_visible: boolean | null;
  created_at: string | null;
  loved_one_id: string | null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user, supabase } = await getServerUser(req, res);

  if (req.method === 'GET') {
    if (!user) return softOk(res, { ok: true, connections: [], userRole: 'student' });
    try {
      const { data, error } = await supabase
        .from('awy_connections')
        .select('id, loved_email, relationship, display_name, status, is_visible, created_at, loved_one_id')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });
      if (error) {
        console.debug('[awy] GET connections soft-fail:', error);
        return softOk(res, { ok: true, connections: [], userRole: 'student' });
      }
      const list: Conn[] = (data || []).map((r: any) => ({
        id: r.id,
        loved_email: String(r.loved_email || '').toLowerCase(),
        relationship: r.relationship ?? null,
        display_name: r.display_name ?? null,
        status: r.status ?? null,
        is_visible: r.is_visible ?? null,
        created_at: r.created_at ?? null,
        loved_one_id: r.loved_one_id ?? null,
      }));
      return softOk(res, { ok: true, connections: list, userRole: 'student' });
    } catch (e) {
      console.debug('[awy] GET connections exception:', e);
      return softOk(res, { ok: true, connections: [], userRole: 'student' });
    }
  }

  if (req.method === 'POST') {
    if (!user) return res.status(401).json({ ok: false, error: 'unauthenticated' });
    try {
      const { loved_email, relationship, display_name } = (req.body || {}) as {
        loved_email?: string; relationship?: string; display_name?: string;
      };
      const email = String(loved_email || '').trim().toLowerCase();
      if (!email) return res.status(400).json({ ok: false, error: 'missing loved_email' });
      const { error } = await supabase
        .from('awy_connections')
        .upsert(
          [{ student_id: user.id, loved_email: email, relationship: relationship || null, display_name: display_name || null, status: 'active', is_visible: true }],
          { onConflict: 'student_id,loved_email', ignoreDuplicates: true }
        );
      if (error) {
        console.debug('[awy] POST connections soft-fail:', error);
        return softOk(res, { ok: true });
      }
      return softOk(res, { ok: true });
    } catch (e) {
      console.debug('[awy] POST connections exception:', e);
      return softOk(res, { ok: true });
    }
  }

  return res.status(405).json({ ok: false, error: 'method not allowed' });
}


