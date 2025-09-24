// src/lib/api/authedFetch.ts
import { getSupabaseClient } from '@/lib/supabase/client';

export async function authedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  let token: string | undefined;

  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token ?? undefined;
    }
  } catch (error) {
    console.debug('[authedFetch] session lookup failed:', error);
  }

  const headers = new Headers(init.headers as HeadersInit | undefined);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(input, {
    credentials: 'include',
    ...init,
    headers,
  });
}
