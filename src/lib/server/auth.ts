// src/lib/server/auth.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getServerClient(req: NextApiRequest, res: NextApiResponse): SupabaseClient {
  // Uses Supabase cookies from req/res. Works on Netlify functions too.
  return createPagesServerClient({ req, res }) as unknown as SupabaseClient;
}

function extractBearerToken(req: NextApiRequest): string | null {
  const raw = req.headers.authorization;
  if (!raw) return null;

  const match = raw.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const token = match[1]?.trim();
  return token ? token : null;
}

function createAnonClient(token?: string): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.debug('[auth] Missing Supabase env for anon client');
    return null;
  }

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: token
      ? {
          headers: { Authorization: `Bearer ${token}` },
        }
      : undefined,
  });
}

export async function getServerUser(req: NextApiRequest, res: NextApiResponse) {
  const supabaseFromCookies = getServerClient(req, res);

  try {
    const { data, error } = await supabaseFromCookies.auth.getUser();
    if (!error && data?.user) {
      return { user: data.user, supabase: supabaseFromCookies };
    }
    if (error) {
      console.debug('[auth] Cookie-based user lookup soft-fail:', error);
    }
  } catch (err) {
    console.debug('[auth] Cookie-based user lookup exception:', err);
  }

  const bearer = extractBearerToken(req);
  if (bearer) {
    const bearerClient = createAnonClient(bearer);
    if (bearerClient) {
      try {
        const { data, error } = await bearerClient.auth.getUser(bearer);
        if (!error && data?.user) {
          return { user: data.user, supabase: bearerClient };
        }
        if (error) {
          console.debug('[auth] Bearer token lookup soft-fail:', error);
        }
      } catch (err) {
        console.debug('[auth] Bearer token lookup exception:', err);
      }
    }
  }

  const fallback = createAnonClient();
  return { user: null, supabase: fallback ?? supabaseFromCookies };
}

export async function requireUser(req: NextApiRequest, res: NextApiResponse) {
  const result = await getServerUser(req, res);
  if (!result.user) {
    res.status(401).json({ ok: false, error: 'unauthenticated' });
    return null;
  }
  return result;
}

export function softOk(res: NextApiResponse, body: any) {
  res.status(200).json(body);
}

export function softFail(res: NextApiResponse, msg: string, extra?: Record<string, any>) {
  res.status(200).json({ ok: false, error: msg, ...(extra ?? {}) });
}

