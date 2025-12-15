import { getSupabaseClient } from '@/lib/supabase/client';

export class AuthMissingError extends Error {
  constructor() {
    super('missing_token');
    this.name = 'AuthMissingError';
  }
}

export type FetchAuthedOptions = {
  requireAuth?: boolean;
};

/**
 * Resolve an access token from Supabase auth or sb-* cookies (client-side).
 */
export async function getAccessTokenFromClient(): Promise<string | undefined> {
  const supabase = getSupabaseClient();
  let token: string | undefined;

  try {
    const { data } = await supabase.auth.getSession();
    token = data.session?.access_token ?? undefined;
    if (!token) {
      const { data: userData, error } = await supabase.auth.getUser();
      if (!error && userData.session?.access_token) {
        token = userData.session.access_token;
      }
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[fetchAuthed] token lookup failed:', err);
    }
  }

  // Cookie fallback (e.g., sb-access-token) in case supabase client state lags
  if (!token && typeof document !== 'undefined') {
    const cookieParts = document.cookie.split(';').map((c) => c.trim()).filter(Boolean);
    const sbCookies = cookieParts.filter((c) => c.startsWith('sb-'));

    // Try exact sb-access-token first
    const direct = sbCookies.find((c) => c.startsWith('sb-access-token='));
    if (direct) token = decodeURIComponent(direct.split('=')[1] || '');

    // Then try any sb-* cookie that looks like JSON with access_token
    if (!token) {
      for (const c of sbCookies) {
        const [, rawVal = ''] = c.split('=');
        if (!rawVal) continue;
        const decoded = decodeURIComponent(rawVal);
        try {
          const parsed = JSON.parse(decoded);
          const candidate =
            parsed?.access_token ||
            parsed?.currentSession?.access_token ||
            parsed?.currentSession?.accessToken;
          if (candidate) {
            token = candidate;
            break;
          }
        } catch {
          // not JSON; skip
        }
      }
    }
  }

  return token;
}

export async function fetchAuthed(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: FetchAuthedOptions = {}
) {
  const token = await getAccessTokenFromClient();

  if (process.env.NODE_ENV !== 'production') {
    const target =
      typeof input === 'string'
        ? input
        : (input as any)?.toString?.() || '[unknown]';
    console.info('[fetchAuthed]', target, { hasToken: !!token });
  }

  if (!token && options.requireAuth !== false) {
    // Do not fire network call; return synthetic 401 response
    return new Response(JSON.stringify({ error: 'missing_token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const headers = new Headers(init.headers as HeadersInit | undefined);
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(input, {
    ...init,
    credentials: 'include',
    headers,
  });
}
