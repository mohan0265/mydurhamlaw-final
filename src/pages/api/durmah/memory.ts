import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerUser } from '@/lib/api/serverAuth';

const ok = (res: NextApiResponse, body: Record<string, unknown> = {}) =>
  res.status(200).json({ ok: true, ...body });

const failSoft = (
  res: NextApiResponse,
  message: string,
  extra: Record<string, unknown> = {}
) => {
  console.warn('[durmah/memory] soft-fail:', message);
  return res.status(200).json({ ok: false, error: message, ...extra });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user, supabase } = await getServerUser(req, res);

  if (!user || !supabase) {
    if (req.method === 'GET') {
      return ok(res, { memory: null });
    }
    return failSoft(res, 'unauthenticated', { saved: false });
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('durmah_memory')
        .select('last_seen_at, last_topic, last_message')
        .eq('user_id', user.id)
        .order('last_seen_at', { ascending: false })
        .limit(1);

      if (error) {
        throw error;
      }

      return ok(res, { memory: data?.[0] ?? null });
    } catch (err: any) {
      console.warn('[durmah/memory] load failed:', err?.message || err);
      return ok(res, { memory: null });
    }
  }

  if (req.method === 'POST') {
    const body = (req.body || {}) as { last_topic?: string | null; last_message?: string | null };
    const payload = {
      user_id: user.id,
      last_topic: body.last_topic ?? null,
      last_message: body.last_message ?? null,
      last_seen_at: new Date().toISOString(),
    };

    try {
      const mod = await import('@/lib/server/supabaseAdmin').catch(() => null as any);
      const supabaseAdmin = mod?.supabaseAdmin ?? null;

      if (!supabaseAdmin) {
        throw new Error('service-role client unavailable');
      }

      const { error } = await supabaseAdmin
        .from('durmah_memory')
        .upsert(payload, { onConflict: 'user_id' });

      if (error) {
        throw error;
      }

      return ok(res, { saved: true });
    } catch (err: any) {
      const message = err?.message || 'save_failed';
      return failSoft(res, message, { saved: false });
    }
  }

  return failSoft(res, 'method_not_allowed');
}
