import { waitForAccessToken } from '@/lib/auth/waitForAccessToken';

export type FetchAuthedOptions = {
  requireAuth?: boolean;
  timeoutMs?: number;
};

export async function fetchAuthed(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: FetchAuthedOptions = {}
) {
  const { token, source } = await waitForAccessToken({ timeoutMs: options.timeoutMs });
  const target =
    typeof input === 'string' ? input : (input as any)?.toString?.() || '[unknown]';

  const isDiagnosticEndpoint =
    typeof target === 'string' &&
    (target.includes('/api/durmah/memory') || target.includes('/api/calendar/day'));

  if (!token && options.requireAuth !== false) {
    // Skip network call; return synthetic 401 response quietly
    if (process.env.NODE_ENV !== 'production' && isDiagnosticEndpoint) {
      console.info('[fetchAuthed]', target, { hasAuth: false, source });
    }
    return new Response(JSON.stringify({ error: 'missing_token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const headers = new Headers(init.headers as HeadersInit | undefined);
  if (token) {
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('x-mdl-access-token', token);
  }
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (process.env.NODE_ENV !== 'production' && isDiagnosticEndpoint) {
    console.info('[fetchAuthed]', target, {
      hasAuth: !!token,
      source,
      authHeader: headers.get('Authorization') ? true : false,
    });
  }

  return fetch(input, {
    ...init,
    credentials: 'include',
    headers,
  });
}
