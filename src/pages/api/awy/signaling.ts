import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/server/supabaseAdmin';

// POST  -> send a signal {toUserId, type, payload}
// GET   -> fetch my inbox since optional ?since=ISO
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const uid = req.headers['x-user-id'] as string | undefined;
    if (!uid) return res.status(401).json({ ok: false, error: 'unauthenticated' });

    if (req.method === 'POST') {
      const { toUserId, type, payload } = req.body || {};
      if (!toUserId || !type) return res.status(400).json({ ok: false, error: 'missing_fields' });

      const { error } = await supabaseAdmin.from('awy_signals').insert({
        from_user_id: uid,
        to_user_id: toUserId,
        type,
        payload,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'GET') {
      const since = (req.query.since as string | undefined) || '1970-01-01T00:00:00.000Z';
      const { data, error } = await supabaseAdmin
        .from('awy_signals')
        .select('*')
        .eq('to_user_id', uid)
        .gt('created_at', since)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return res.status(200).json({ ok: true, messages: data || [] });
    }

    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  } catch (err: any) {
    console.error('[awy/signaling] error', err);
    return res.status(500).json({ ok: false, error: err?.message || 'server_error' });
  }
}

