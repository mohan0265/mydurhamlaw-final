import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/server/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });

  try {
    const uid = req.headers['x-user-id'] as string | undefined;
    if (!uid) return res.status(401).json({ ok: false, error: 'unauthenticated' });

    const sub = req.body?.subscription;
    if (!sub || !sub.endpoint) return res.status(400).json({ ok: false, error: 'invalid_subscription' });

    const { error } = await supabaseAdmin
      .from('push_subscriptions')
      .upsert(
        {
          user_id: uid,
          endpoint: sub.endpoint,
          subscription: sub,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,endpoint' }
      );

    if (error) throw error;
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error('[push/subscribe] error', err);
    return res.status(500).json({ ok: false, error: err?.message || 'server_error' });
  }
}

