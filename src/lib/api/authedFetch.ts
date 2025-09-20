// src/lib/api/authedFetch.ts
export async function authedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const res = await fetch(input, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    ...init,
  });
  return res;
}
