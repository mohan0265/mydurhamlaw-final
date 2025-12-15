import { getSupabaseClient } from '@/lib/supabase/client';

export async function fetchAuthed(input: RequestInfo | URL, init: RequestInit = {}) {
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

  if (!token && process.env.NODE_ENV !== 'production') {
    const target =
      typeof input === 'string'
        ? input
        : (input as any)?.toString?.() || '[unknown]';
    console.warn(
      `[fetchAuthed] no access token found in session or sb-* cookies for request to ${target}; request may 401`
    );
  }

  const headers = new Headers(init.headers as HeadersInit | undefined);
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(input, {
    credentials: 'same-origin',
    ...init,
    headers,
  });
}
