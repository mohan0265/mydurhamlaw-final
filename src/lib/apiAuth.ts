import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function parseCookies(req: NextApiRequest): Record<string, string> {
  const header = req.headers.cookie;
  if (!header) return {};
  return header.split(';').reduce((acc, pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return acc;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    acc[key] = decodeURIComponent(val);
    return acc;
  }, {} as Record<string, string>);
}

function tryParseSupabaseAuthToken(raw: string | undefined | null): string | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return (
      parsed?.currentSession?.access_token ||
      parsed?.currentSession?.accessToken ||
      parsed?.access_token ||
      null
    );
  } catch {
    return null;
  }
}

export function getBearerToken(req: NextApiRequest): {
  token: string | null;
  source: 'header' | 'cookie' | 'none';
  cookieNames: string[];
} {
  const authHeader = req.headers.authorization || (req.headers as any)?.Authorization;
  const cookies = parseCookies(req);
  const cookieKeys = Object.keys(cookies);

  if (typeof authHeader === 'string') {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match && match[1]) return { token: match[1].trim(), source: 'header', cookieNames: cookieKeys };
  }

  const xHeader = req.headers['x-mdl-access-token'];
  if (typeof xHeader === 'string' && xHeader.trim()) {
    return { token: xHeader.trim(), source: 'header', cookieNames: cookieKeys };
  }

  // Handle chunked Supabase cookies: sb-<ref>-auth-token.0, .1, ...
  const chunkGroups = cookieKeys
    .filter((k) => /\.?\d+$/.test(k) && k.includes('auth-token'))
    .reduce<Record<string, string[]>>((acc, key) => {
      const base = key.replace(/\.\d+$/, '');
      if (!acc[base]) acc[base] = [];
      acc[base].push(key);
      return acc;
    }, {});

  for (const base in chunkGroups) {
    const parts = (chunkGroups[base] || [])
      .sort((a, b) => {
        const ai = Number(a.split('.').pop());
        const bi = Number(b.split('.').pop());
        return ai - bi;
      })
      .map((k) => cookies[k]);
    const combined = decodeURIComponent(parts.join(''));
    const token = tryParseSupabaseAuthToken(combined);
    if (token) return { token, source: 'cookie', cookieNames: cookieKeys };
  }

  // Non-chunked Supabase JSON cookie (sb-<ref>-auth-token)
  const sbJson = cookieKeys.find((k) => k.includes('auth-token'));
  if (sbJson) {
    const token = tryParseSupabaseAuthToken(cookies[sbJson]);
    if (token) return { token, source: 'cookie', cookieNames: cookieKeys };
  }

  // Legacy supabase-auth-token
  if (cookies['supabase-auth-token']) {
    const token = tryParseSupabaseAuthToken(cookies['supabase-auth-token']);
    if (token) return { token, source: 'cookie', cookieNames: cookieKeys };
  }

  return { token: null, source: 'none', cookieNames: cookieKeys };
}

type ApiAuthResult =
  | { status: 'ok'; user: any; supabase: SupabaseClient; tokenSource: 'header' | 'cookie'; cookieNames: string[] }
  | { status: 'missing_token'; tokenSource: 'none'; cookieNames: string[] }
  | { status: 'invalid_token'; tokenSource: 'header' | 'cookie'; cookieNames: string[] }
  | { status: 'misconfigured'; tokenSource: 'header' | 'cookie' | 'none'; cookieNames: string[] };

function logMissingToken(reason: string) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[apiAuth] missing token (${reason})`);
  }
}

export async function getApiAuth(req: NextApiRequest): Promise<ApiAuthResult> {
  const { token, source, cookieNames } = getBearerToken(req);
  if (!token) {
    logMissingToken('no Authorization header or auth cookies');
    return { status: 'missing_token', tokenSource: 'none', cookieNames };
  }

  if (!SUPABASE_URL || !ANON_KEY) {
    console.error('[apiAuth] missing Supabase env vars');
    return { status: 'misconfigured', tokenSource: source === 'none' ? 'none' : source, cookieNames };
  }

  const supabase = createClient(SUPABASE_URL, ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    logMissingToken(error?.message || 'getUser failed');
    return { status: 'invalid_token', tokenSource: source === 'none' ? 'header' : source, cookieNames };
  }

  return { status: 'ok', user: data.user, supabase, tokenSource: source === 'none' ? 'header' : source, cookieNames };
}

export async function getUserOrThrow(req: NextApiRequest, res?: NextApiResponse) {
  const result = await getApiAuth(req);
  if (result.status === 'ok') return result;

  if (res && !res.headersSent) {
    if (result.status === 'misconfigured') {
      res.status(500).json({ error: 'server_misconfigured' });
    } else {
      res.status(401).json({ error: 'unauthorized' });
    }
  }
  throw new Error(result.status);
}
