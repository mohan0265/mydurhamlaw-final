// src/pages/api/awy/presence.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

/**
 * Lightweight presence endpoint for AWY & PresenceBadge.
 * Auth: Supabase cookie or Authorization: Bearer <JWT>
 *
 * Response:
 * { connected: boolean, me: { id, email }, lovedOnes: Array<{ id, name, online: boolean }> }
 *
 * NOTE: This is safe to ship even without a full AWY backend.
 * It prevents 404 spam and lets the UI render gracefully.
 */

function getSupabaseForServer(req: NextApiRequest, res: NextApiResponse) {
  const url = process.env.SUPABASE_URL as string;
  const anon = process.env.SUPABASE_ANON_KEY as string;
  if (!url || !anon) return null;

  // We’ll honor Authorization header if present, else cookies.
  const authHeader = req.headers.authorization ?? '';
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  const sb = createClient(url, anon, {
    auth: {
      persistSession: false,
      detectSessionInUrl: false,
      autoRefreshToken: false,
    },
    global: {
      headers: jwt ? { Authorization: `Bearer ${jwt}` } : undefined,
    },
  });

  return sb;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getSupabaseForServer(req, res);

    // Try to identify the user (works with cookie or bearer)
    let userId: string | null = null;
    let email: string | null = null;

    if (supabase) {
      try {
        const { data } = await supabase.auth.getUser();
        userId = data?.user?.id ?? null;
        email  = data?.user?.email ?? null;
      } catch {
        // not signed in, that’s fine
      }
    }

    // If no user, return a harmless “offline” structure (prevents UI crashes)
    if (!userId) {
      return res.status(200).json({
        connected: false,
        me: null,
        lovedOnes: [],
      });
    }

    // If you later store AWY relations, hydrate here. For now provide a stubbed structure.
    // Example future query (adjust table/columns as per your schema):
    // const { data: loved } = await supabase.from('loved_ones').select('id,name,online').eq('owner_id', userId);

    return res.status(200).json({
      connected: true,        // you can compute a real signal later
      me: { id: userId, email },
      lovedOnes: [],          // populate when your AWY tables are ready
    });
  } catch (e: any) {
    console.error('AWY presence error:', e?.message || e);
    return res.status(200).json({
      connected: false,
      me: null,
      lovedOnes: [],
      error: 'presence_probe_failed',
    });
  }
}
