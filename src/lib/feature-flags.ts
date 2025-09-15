// src/lib/feature-flags.ts
/**
 * Centralised feature flag helpers used across the app.
 * Supports env flags, URL overrides, and localStorage toggles.
 *
 * Env (set in Netlify / Vercel):
 *   NEXT_PUBLIC_ENABLE_AWY=1 | true
 *   NEXT_PUBLIC_FEATURE_AWY=1 | true
 *   NEXT_PUBLIC_ENABLE_VOICE_FEATURES=1 | true
 *
 * URL overrides (runtime):
 *   ?awy=1
 *   ?voice=1
 *
 * Local overrides (dev/test in console):
 *   localStorage.setItem('awy:enabled', '1')
 *   localStorage.setItem('voice:enabled', '1')
 */

function envOn(...vals: Array<string | undefined | null>): boolean {
  return vals
    .map(v => (v ?? '').toString().toLowerCase())
    .some(v => v === '1' || v === 'true');
}

function urlOrLS(key: 'awy' | 'voice'): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get(key) === '1') return true;
    if (window.localStorage?.getItem(`${key}:enabled`) === '1') return true;
  } catch {
    // ignore
  }
  return false;
}

export function isAWYEnabled(): boolean {
  const envEnabled = envOn(
    process.env.NEXT_PUBLIC_ENABLE_AWY,
    process.env.NEXT_PUBLIC_FEATURE_AWY
  );
  return envEnabled || urlOrLS('awy');
}

export function isVoiceEnabled(): boolean {
  const envEnabled = envOn(process.env.NEXT_PUBLIC_ENABLE_VOICE_FEATURES);
  return envEnabled || urlOrLS('voice');
}
