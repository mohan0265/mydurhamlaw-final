'use client';

import Link from 'next/link';
import { useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '@/lib/supabase/AuthContext';

/** Safe pathname helper that works during prerender and on the client */
function useSafePathname(): string {
  const [path, setPath] = useState<string>('');
  useEffect(() => {
    setPath(typeof window !== 'undefined' ? window.location?.pathname ?? '' : '');
  }, []);
  return path;
}

type NavItem = { href: string; label: string };

const RAW_LINKS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/planner/year-at-a-glance', label: 'My Year at a Glance' },
  { href: '/lounge', label: 'Premier Lounge' },
];

// Deduplicate by href (defensive)
const uniqueByHref = (links: NavItem[]) =>
  Array.from(new Map(links.map((l) => [l.href, l])).values());

export default function Header() {
  const { user } = useContext(AuthContext) || {};
  const pathname = useSafePathname();
  const [open, setOpen] = useState(false);

  const LINKS = useMemo(() => uniqueByHref(RAW_LINKS), []);
  // If logged out, route Dashboard to /signup to avoid auth bounce
  const resolvedLinks = useMemo<NavItem[]>(
    () =>
      LINKS.map((l) =>
        !user && l.href === '/dashboard' ? { ...l, href: '/signup' } : l
      ),
    [LINKS, user]
  );

  const isActive = (href: string) =>
    !!pathname && href !== '/' && (pathname === href || pathname.startsWith(href + '/'));

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900">
          <span className="text-xl">My</span>
          <span className="text-xl text-emerald-600">Durham</span>
          <span className="text-xl">Law</span>
        </Link>

        <nav className="hidden gap-6 md:flex">
          {resolvedLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition-colors ${
                isActive(l.href) ? 'text-emerald-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          {user ? (
            <span className="text-sm text-gray-600">Hi, {user.email ?? 'student'}</span>
          ) : (
            <Link
              href="/signup"
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Sign in
            </Link>
          )}
        </div>

        <button
          aria-label="Open menu"
          className="inline-flex items-center rounded-md border border-gray-300 px-3 py-2 text-gray-700 md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          Menu
        </button>
      </div>

      {open && (
        <div className="border-t border-gray-200 md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3">
            {resolvedLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`rounded-md px-2 py-2 text-sm font-medium ${
                  isActive(l.href) ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {l.label}
              </Link>
            ))}
            <div className="pt-2">
              {user ? (
                <span className="text-sm text-gray-600">Signed in</span>
              ) : (
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="inline-block rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Sign in
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
