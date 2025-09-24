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
    return createPagesServerClient({ req, res });
  } catch (err) {
    console.debug('[auth] getServerClient failed:', (err as any)?.message ?? err);
    throw err;
  }
}

/**
 * Create a reusable anonymous Supabase client (optionally attach a bearer token to headers).
 * This is intended for server-side code that should not rely on browser cookies.
 */
export function createAnonClient(token?: string): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.debug(
      '[auth] Missing Supabase env vars NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  });

  return client;
}

/**
 * Extract a Bearer token string from an incoming request's Authorization header.
 * Returns null when no token present.
 */
export function extractBearerToken(req: NextApiRequest): string | null {
  const raw = (req.headers?.authorization ?? '') as string;
  if (!raw) return null;
  const match = raw.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  return match?.[1]?.trim() ?? null;
}

/**
 * Lightweight JSON 200 helper used by many routes to return a consistent OK payload.
 */
export function softOk(res: NextApiResponse, payload: any) {
  try {
    return res.status(200).json(payload);
  } catch (err) {
    // Keep debug lightweight
    console.debug('[auth] softOk failed:', (err as any)?.message ?? err);
    // fall back to a minimal response
    try { return res.status(200).end(); } catch { /* ignore */ }
  }
}

/**
 * Ensure there's an authenticated user based on the cookies in the incoming request.
 * Returns an object { user, supabase } when authenticated, or null when not.
 * Callers can choose to `return softOk(res, {...})` or throw as needed.
 */
export async function requireUser(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = createPagesServerClient({ req, res });
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.debug('[auth] requireUser supabase.getUser error:', (error as any)?.message ?? error);
      return null;
    }
    if (!data?.user) return null;
    return { user: data.user, supabase };
  } catch (err) {
    console.debug('[auth] requireUser failed:', (err as any)?.message ?? err);
    return null;
  }
}
