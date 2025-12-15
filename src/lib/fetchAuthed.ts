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
    const cookieParts = document.cookie.split(';').map((c) => c.trim());
    const direct = cookieParts.find((c) => c.startsWith('sb-access-token='));
    if (direct) token = decodeURIComponent(direct.split('=')[1] || '');
    if (!token) {
      const jsonCookie = cookieParts.find((c) => c.startsWith('sb-') && c.includes('-auth-token='));
      if (jsonCookie) {
        const raw = decodeURIComponent(jsonCookie.split('=')[1] || '');
        try {
          const parsed = JSON.parse(raw);
          token =
            parsed?.access_token ||
            parsed?.currentSession?.access_token ||
            parsed?.currentSession?.accessToken ||
            undefined;
        } catch {
          // ignore
        }
      }
    }
  }

  if (!token && process.env.NODE_ENV !== 'production') {
    console.warn('[fetchAuthed] missing access token; request will likely 401');
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
