import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserOrThrow } from '@/lib/apiAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let user, supabase;
  try {
    const auth = await getUserOrThrow(req, res);
    user = auth.user;
    supabase = auth.supabase;
  } catch {
    return;
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('durmah_memory')
        .select('user_id, last_seen_at, last_topic, last_message')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.debug('[durmah] memory GET soft-fail:', error);
        return res.status(200).json({ ok: true, memory: null });
      }

      return res.status(200).json({ ok: true, memory: data ?? null });
    } catch (e) {
      console.debug('[durmah] memory GET exception:', e);
      return res.status(200).json({ ok: true, memory: null });
    }
  }

  if (req.method === 'POST') {
    try {
      const { last_topic, last_message } = (req.body || {}) as {
        last_topic?: string;
        last_message?: string;
      };

      const { error } = await supabase
        .from('durmah_memory')
        .upsert(
          [
            {
              user_id: user.id,
              last_topic: last_topic || null,
              last_message: last_message || null,
              last_seen_at: new Date().toISOString(),
            },
          ],
          { onConflict: 'user_id' }
        );

      if (error) {
        console.debug('[durmah] memory POST soft-fail:', error);
        return res.status(200).json({ ok: true });
      }

      return res.status(200).json({ ok: true });
    } catch (e) {
      console.debug('[durmah] memory POST exception:', e);
      return res.status(200).json({ ok: true });
    }
  }

  return res.status(405).json({ ok: false, error: 'method not allowed' });
}
