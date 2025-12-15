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
    const cookieToken = document.cookie
      .split(';')
      .map(c => c.trim())
      .find(c => c.startsWith('sb-access-token='));
    if (cookieToken) {
      token = decodeURIComponent(cookieToken.split('=')[1] || '');
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
