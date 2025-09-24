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
 * Soft helper: respond with status 200 and a JSON body used by our API soft-fail pattern.
 * Returns void (callers sometimes `return softOk(...)`).
 */
export function softOk(res: NextApiResponse, body: Record<string, any> = { ok: true }) {
  try {
    res.status(200).json(body);
  } catch (err) {
    console.debug('[auth] softOk failed:', err);
  }
}

/**
 * Guard that ensures a user is authenticated via cookies on server-side API routes.
 * Returns an object `{ user, supabase }` when authenticated, otherwise calls `softOk(res, ...)` and returns null.
 */
export async function requireUser(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<{ user: any; supabase: SupabaseClient } | null> {
  try {
    const supabase = getServerClient(req, res);
    // supabase.auth.getUser() returns { data: { user }, error }
    const result = await supabase.auth.getUser();
    const user = result?.data?.user ?? null;
    if (!user) {
      // softFail pattern used in this project: return a 200 with ok:false so front-end won't crash
      softOk(res, { ok: false, error: 'unauthenticated' });
      return null;
    }
    return { user, supabase };
  } catch (err) {
    console.debug('[auth] requireUser failed:', err);
    softOk(res, { ok: false, error: 'auth_error' });
    return null;
  }
}
