// src/pages/api/durmah/memory.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerUser } from '@/lib/api/serverAuth';

interface JsonBody {
  last_topic?: string | null;
  last_message?: string | null;
}

type Json = Record<string, unknown>;

function ok<T extends Json>(res: NextApiResponse, body: T) {
  return res.status(200).json({ ok: true, ...body });
}

function failSoft<T extends Json>(res: NextApiResponse, body: T, warn: unknown) {
  const message = (warn as any)?.message ?? warn;
  console.warn('[durmah/memory] soft-fail:', message);
  return res.status(200).json({ ok: true, ...body });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user, supabase } = await getServerUser(req, res);

  if (!user) {
    return res.status(401).json({ ok: false, error: 'unauthenticated' });
  }

  if (req.method === 'GET') {
    if (!supabase) {
      return ok(res, { memory: null });
    }

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
    } catch (err) {
      return failSoft(res, { memory: null }, err);
    }
  }

  if (req.method === 'POST') {
    const body = (req.body || {}) as JsonBody;
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
        throw new Error('supabaseAdmin unavailable');
      }

      const { error } = await supabaseAdmin
        .from('durmah_memory')
        .upsert(payload, { onConflict: 'user_id' });

      if (error) {
        throw error;
      }

      return ok(res, { saved: true });
    } catch (err) {
      return failSoft(res, { saved: false }, err);
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ ok: false, error: 'method_not_allowed' });
}