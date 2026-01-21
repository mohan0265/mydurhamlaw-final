import { getSupabaseClient } from '@/lib/supabase/client';

type WaitOptions = {
  timeoutMs?: number;
};

export type TokenResult = {
  token: string | null;
  source: 'session' | 'cookie' | 'timeout';
};

function readCookieToken(): string | null {
  if (typeof document === 'undefined') return null;
  const cookies: Record<string, string> = {};
  document.cookie.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    cookies[key] = decodeURIComponent(val);
  });

  // chunked sb-<ref>-auth-token.0, .1, ...
  const keys = Object.keys(cookies);
  const chunkGroups = keys
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
    try {
      const parsed = JSON.parse(combined);
      const token =
        parsed?.currentSession?.access_token ||
        parsed?.currentSession?.accessToken ||
        parsed?.access_token;
      if (token) return token;
    } catch {
      // ignore parse errors
    }
  }

  // non-chunked sb-*-auth-token or legacy supabase-auth-token
  const jsonCookieKey = keys.find((k) => k.includes('auth-token'));
  if (jsonCookieKey) {
    try {
      const parsed = JSON.parse(cookies[jsonCookieKey] || '');
      const token =
        parsed?.currentSession?.access_token ||
        parsed?.currentSession?.accessToken ||
        parsed?.access_token;
      if (token) return token;
    } catch {
      // ignore
    }
  }
  return null;
}

/**
 * Wait briefly for a Supabase access token to be available.
 * Returns the token string or null if not found before timeout.
 */
export async function waitForAccessToken(
  options: WaitOptions = {}
): Promise<TokenResult> {
  const timeoutMs = options.timeoutMs ?? 2000;
  const supabase = getSupabaseClient();

  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      return { token: data.session.access_token, source: 'session' };
    }
  } catch {
    // fall through to subscription
  }

  const cookieToken = readCookieToken();
  if (cookieToken) return { token: cookieToken, source: 'cookie' };

  return new Promise((resolve) => {
    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        const fallback = readCookieToken();
        resolve({ token: fallback, source: fallback ? 'cookie' : 'timeout' });
      }
    }, timeoutMs);

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (resolved) return;
        if (session?.access_token) {
          resolved = true;
          clearTimeout(timer);
          subscription?.subscription.unsubscribe();
          resolve({ token: session.access_token, source: 'session' });
        }
      }
    );
  });
}
