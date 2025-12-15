import { getSupabaseClient } from '@/lib/supabase/client';

export async function fetchAuthed(input: RequestInfo | URL, init: RequestInit = {}) {
  const supabase = getSupabaseClient();
  let token: string | undefined;

  try {
    const { data } = await supabase.auth.getSession();
    token = data.session?.access_token ?? undefined;
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[fetchAuthed] token lookup failed:', err);
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
