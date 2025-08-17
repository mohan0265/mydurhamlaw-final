// src/lib/authRedirect.ts
export function getAuthRedirect() {
  // Always prefer the env var (set on Netlify)
  const base = process.env.NEXT_PUBLIC_APP_URL
    // fallback in browser if env missing (local dev)
    || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/auth/callback`;
}