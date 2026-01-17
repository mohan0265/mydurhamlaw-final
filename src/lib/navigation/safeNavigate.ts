import { NextRouter } from 'next/router';

export function isRouteAbortError(err: unknown): boolean {
  const error = err as any;
  if (!error) return false;
  
  // Standard AbortController signal
  if (error.name === 'AbortError') return true;
  
  // Next.js specific
  const msg = error.message || '';
  return (
    error.cancelled === true ||
    msg.includes('Abort fetching component for route') ||
    msg.includes('Load cancelled')
  );
}

export function safeReplace(router: NextRouter, url: string) {
  if (router.asPath === url || router.pathname === url) return Promise.resolve();
  return router.replace(url).catch((err) => {
    if (isRouteAbortError(err)) return;
    throw err;
  });
}

export function safePush(router: NextRouter, url: string) {
  if (router.asPath === url || router.pathname === url) return Promise.resolve();
  return router.push(url).catch((err) => {
    if (isRouteAbortError(err)) return;
    throw err;
  });
}
