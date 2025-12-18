import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let user = null;
  let supabase = null;

  // 1. Try Bearer Token (Header)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data, error } = await supabaseAnon.auth.getUser(token);
    if (!error && data.user) {
      user = data.user;
      // create a client with the user's token for RLS
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );
    }
  }

  // 2. Try Cookie (Standard Next.js helper)
  if (!user) {
    const supabaseCookies = createPagesServerClient({ req, res });
    const { data } = await supabaseCookies.auth.getUser();
    if (data.user) {
      user = data.user;
      supabase = supabaseCookies;
    }
  }

  if (!user || !supabase) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { is_available } = req.body;

  if (typeof is_available !== 'boolean') {
    return res.status(400).json({ error: 'is_available boolean required' });
  }

  try {
    // Call the RPC function we defined in migration
    const { error } = await supabase.rpc('awy_heartbeat', {
      p_is_available: is_available
    });

    if (error) throw error;

    return res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error('Presence update error:', error);
    return res.status(500).json({ error: error.message });
  }
}
