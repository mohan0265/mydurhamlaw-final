// src/components/GlobalHeader.tsx
'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/supabase/AuthContext';
import LogoutButton from '@/components/auth/LogoutButton';
import PresenceBadge from '@/components/PresenceBadge';

type MenuItem = { label: string; href: string };
type Menu = { label: string; items: MenuItem[] };

function cx(...cls: Array<string | undefined | false | null>) {
  return cls.filter(Boolean).join(' ');
}

function ActiveLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const active =
    router.pathname === href || (href !== '/' && router.pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={cx(
        'px-3 py-2 rounded-md text-sm font-medium transition',
        active ? 'bg-white/20 text-white' : 'text-white/90 hover:text-white',
        className
      )}
    >
      {children}
    </Link>
  );
}

export default function GlobalHeader() {
  const router = useRouter();
  const { user } = useAuth() || { user: null };

  // --- Menus ---------------------------------------------------------------
  // Keep links only to pages we actually have in the app.
  const studyMenu: Menu = useMemo(
    () => ({
      label: 'Study',
      items: [
        { label: 'Year at a Glance', href: '/year-at-a-glance' }, // ✅ YAAG (correct page)
        { label: 'Study Schedule', href: '/study-schedule' },
        { label: 'Assignments', href: '/assignments' },
        { label: 'Research Hub', href: '/research-hub' },
        { label: 'Durmah (Wellbeing)', href: '/wellbeing' },
      ],
    }),
    []
  );

  const communityMenu: Menu = useMemo(
    () => ({
      label: 'Community',
      items: [
        { label: 'Student Lounge', href: '/lounge' },
        { label: 'Community', href: '/community' },
        { label: 'News', href: '/news' },
      ],
    }),
    []
  );

  const infoMenu: Menu = useMemo(
    () => ({
      label: 'Info',
      items: [
        { label: 'About', href: '/about' },
        { label: 'Pricing', href: '/pricing' },
        { label: 'Contact', href: '/contact' },
      ],
    }),
    []
  );

  const [openMobile, setOpenMobile] = useState(false);
  const [openStudy, setOpenStudy] = useState(false);
  const [openCommunity, setOpenCommunity] = useState(false);
  const [openInfo, setOpenInfo] = useState(false);
  const [openAccount, setOpenAccount] = useState(false);

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0]?.replace(/[0-9]/g, '') ||
    'Student';

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-violet-700 to-indigo-700 shadow">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="h-14 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="text-white font-semibold text-lg">
              My <span className="text-pink-200">Durham</span> Law
            </Link>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <ActiveLink href="/dashboard" className="font-semibold">
              Dashboard
            </ActiveLink>

            {/* Study (submenu) */}
            <div
              className="relative"
              onMouseEnter={() => setOpenStudy(true)}
              onMouseLeave={() => setOpenStudy(false)}
            >
              <button
                className="px-3 py-2 rounded-md text-sm font-medium text-white/90 hover:text-white"
                onClick={() => setOpenStudy((v) => !v)}
              >
                {studyMenu.label}
              </button>
              {openStudy && (
                <div className="absolute left-0 mt-2 w-56 rounded-xl border border-white/10 bg-white/95 shadow-2xl backdrop-blur">
                  <ul className="py-2">
                    {studyMenu.items.map((it) => (
                      <li key={it.href}>
                        <Link
                          href={it.href}
                          className="block px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 rounded-lg mx-1"
                        >
                          {it.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Community (submenu) */}
            <div
              className="relative"
              onMouseEnter={() => setOpenCommunity(true)}
              onMouseLeave={() => setOpenCommunity(false)}
            >
              <button
                className="px-3 py-2 rounded-md text-sm font-medium text-white/90 hover:text-white"
                onClick={() => setOpenCommunity((v) => !v)}
              >
                {communityMenu.label}
              </button>
              {openCommunity && (
                <div className="absolute left-0 mt-2 w-56 rounded-xl border border-white/10 bg-white/95 shadow-2xl backdrop-blur">
                  <ul className="py-2">
                    {communityMenu.items.map((it) => (
                      <li key={it.href}>
                        <Link
                          href={it.href}
                          className="block px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 rounded-lg mx-1"
                        >
                          {it.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Info (submenu) */}
            <div
              className="relative"
              onMouseEnter={() => setOpenInfo(true)}
              onMouseLeave={() => setOpenInfo(false)}
            >
              <button
                className="px-3 py-2 rounded-md text-sm font-medium text-white/90 hover:text-white"
                onClick={() => setOpenInfo((v) => !v)}
              >
                {infoMenu.label}
              </button>
              {openInfo && (
                <div className="absolute left-0 mt-2 w-56 rounded-xl border border-white/10 bg-white/95 shadow-2xl backdrop-blur">
                  <ul className="py-2">
                    {infoMenu.items.map((it) => (
                      <li key={it.href}>
                        <Link
                          href={it.href}
                          className="block px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 rounded-lg mx-1"
                        >
                          {it.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Right side (desktop): presence + auth/CTAs */}
          <div className="hidden md:flex items-center gap-3">
            {/* tiny online badge (uses AuthContext under the hood) */}
            <PresenceBadge />

            {user ? (
              <>
                <span className="text-white/90 text-sm">Hi, {displayName}</span>

                {/* Manage Billing goes to /billing */}
                <Link
                  href="/billing"
                  className="px-3 py-2 rounded-md text-sm font-semibold bg-white text-indigo-700 hover:bg-indigo-50 transition"
                  title="Manage subscription & invoices"
                >
                  Manage Billing
                </Link>

                <LogoutButton className="px-3 py-2 rounded-md border hover:bg-white/10 text-white text-sm" />
              </>
            ) : (
              <>
                <Link
                  href="/pricing"
                  className="text-white/90 hover:text-white text-sm"
                  title="See plans"
                >
                  Pricing
                </Link>
                <Link
                  href="/pricing"
                  className="px-3 py-2 rounded-md text-sm font-semibold bg-white text-indigo-700 hover:bg-indigo-50 transition"
                  title="Start your free trial"
                >
                  Start Free Trial
                </Link>
                <Link
                  href="/login"
                  className="text-white/90 hover:text-white text-sm"
                  title="Sign in"
                >
                  Login
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-white/90 hover:text-white"
            onClick={() => setOpenMobile((v) => !v)}
            aria-label="Toggle menu"
          >
            {openMobile ? (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                <path stroke="currentColor" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                <path stroke="currentColor" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {openMobile && (
        <div className="md:hidden border-t border-white/10 bg-indigo-700/95 backdrop-blur">
          <div className="px-4 py-3 space-y-3">
            <div className="flex items-center justify-between">
              <Link
                href="/dashboard"
                className="px-3 py-2 rounded-md text-sm font-semibold bg-white text-indigo-700 hover:bg-indigo-50 transition"
                onClick={() => setOpenMobile(false)}
              >
                Dashboard
              </Link>
              <PresenceBadge />
            </div>

            {/* STUDY */}
            <div className="rounded-lg bg-white/5">
              <button
                className="w-full text-left px-3 py-2 text-white/90 hover:text-white font-medium"
                onClick={() => setOpenStudy((v) => !v)}
              >
                {studyMenu.label}
              </button>
              {openStudy && (
                <ul className="pb-2">
                  {studyMenu.items.map((it) => (
                    <li key={it.href}>
                      <Link
                        href={it.href}
                        className="block px-4 py-2 text-sm text-white/90 hover:text-white hover:bg-white/10"
                        onClick={() => setOpenMobile(false)}
                      >
                        {it.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* COMMUNITY */}
            <div className="rounded-lg bg-white/5">
              <button
                className="w-full text-left px-3 py-2 text-white/90 hover:text-white font-medium"
                onClick={() => setOpenCommunity((v) => !v)}
              >
                {communityMenu.label}
              </button>
              {openCommunity && (
                <ul className="pb-2">
                  {communityMenu.items.map((it) => (
                    <li key={it.href}>
                      <Link
                        href={it.href}
                        className="block px-4 py-2 text-sm text-white/90 hover:text-white hover:bg-white/10"
                        onClick={() => setOpenMobile(false)}
                      >
                        {it.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* INFO */}
            <div className="rounded-lg bg-white/5">
              <button
                className="w-full text-left px-3 py-2 text-white/90 hover:text-white font-medium"
                onClick={() => setOpenInfo((v) => !v)}
              >
                {infoMenu.label}
              </button>
              {openInfo && (
                <ul className="pb-2">
                  {infoMenu.items.map((it) => (
                    <li key={it.href}>
                      <Link
                        href={it.href}
                        className="block px-4 py-2 text-sm text-white/90 hover:text-white hover:bg-white/10"
                        onClick={() => setOpenMobile(false)}
                      >
                        {it.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* ACCOUNT */}
            <div className="rounded-lg bg-white/5">
              <button
                className="w-full text-left px-3 py-2 text-white/90 hover:text-white font-medium"
                onClick={() => setOpenAccount((v) => !v)}
              >
                {user ? 'Account' : 'Get Started'}
              </button>
              {openAccount && (
                <div className="pb-2">
                  {user ? (
                    <>
                      <Link
                        href="/billing"
                        className="block px-4 py-2 text-sm text-white/90 hover:text-white hover:bg-white/10"
                        onClick={() => setOpenMobile(false)}
                      >
                        Manage Billing
                      </Link>
                      <div className="px-4 py-2 text-xs text-white/80">
                        Signed in as <span className="font-medium">{displayName}</span>
                      </div>
                      <div className="px-3 pb-2">
                        <LogoutButton className="w-full text-center px-3 py-2 rounded-md bg-white text-indigo-700 text-sm" />
                      </div>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/pricing"
                        className="block px-4 py-2 text-sm text-white/90 hover:text-white hover:bg-white/10"
                        onClick={() => setOpenMobile(false)}
                      >
                        See Pricing
                      </Link>
                      <Link
                        href="/pricing"
                        className="block px-4 py-2 text-sm text-indigo-700 bg-white rounded mx-3 mt-1 text-center font-semibold hover:bg-indigo-50"
                        onClick={() => setOpenMobile(false)}
                      >
                        Start Free Trial
                      </Link>
                      <Link
                        href="/login"
                        className="block px-4 py-2 text-sm text-white/90 hover:text-white hover:bg-white/10"
                        onClick={() => setOpenMobile(false)}
                      >
                        Login
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
