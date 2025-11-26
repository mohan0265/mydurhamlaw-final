// src/lib/server/auth.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Return a Supabase server client wired to the incoming request/res (uses auth cookies).
 * Use this from API routes that need to read the session from cookies.
 */
export function getServerClient(req: NextApiRequest, res: NextApiResponse) {
  try {
    return createPagesServerClient({ 
      req, 
      res,
      supabaseUrl: SUPABASE_URL,
      supabaseKey: SUPABASE_ANON_KEY
    });
  } catch (err) {
    console.debug('[auth] getServerClient failed:', (err as any)?.message ?? err);
    throw err;
  }
}

// ... (keep createAnonClient and extractBearerToken as is)

export async function requireUser(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = createPagesServerClient({ 
      req, 
      res,
      supabaseUrl: SUPABASE_URL,
      supabaseKey: SUPABASE_ANON_KEY
    });
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      console.debug('[auth] requireUser failed:', (error as any)?.message ?? error);
      return null;
    }
    return { user: data.user, supabase };
  } catch (err) {
    console.error('[auth] requireUser exception:', err);
    return null;
  }
}
