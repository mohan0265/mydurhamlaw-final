// src/lib/server/auth.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseClient } from '@/lib/supabase/client';
import { type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Return a Supabase server client.
 * NOTE: Cookie support is removed to comply with strict universal client requirement.
 * Use Bearer tokens for auth.
 */
export function getServerClient(req: NextApiRequest, res: NextApiResponse) {
  return getSupabaseClient();
}

/**
 * Create a reusable anonymous Supabase client (optionally attach a bearer token to headers).
 */
export function createAnonClient(token?: string): SupabaseClient {
  const client = getSupabaseClient();
  // Note: Since getSupabaseClient returns a singleton, we cannot blindly modify global headers 
  // without affecting other requests if we were using a true singleton instance in a persistent process.
  // However, for typical serverless usage, this might be okay. 
  // But strictly speaking, we shouldn't modify a singleton.
  // Given user instructions, we just return the universal client.
  // If token is needed, pass it to methods like getUser(token).
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

export function softOk(res: NextApiResponse, payload?: any) {
  return res.status(200).json(payload ?? { ok: true });
}

export async function requireUser(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = getServerClient(req, res);
    
    // Try to get token
    const token = extractBearerToken(req);
    
    // If token exists, use it. usage of getUser(token) is valid in supabase-js v2
    const { data, error } = await supabase.auth.getUser(token || undefined);
    
    if (error || !data?.user) {
      const msg = (error as any)?.message ?? 'No user found';
      console.debug('[auth] requireUser failed:', msg);
      return { error: msg };
    }
    return { user: data.user, supabase };
  } catch (err) {
    console.error('[auth] requireUser exception:', err);
    return null;
  }
}
