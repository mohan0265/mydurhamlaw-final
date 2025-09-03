// src/components/GlobalHeader.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/lib/supabase/AuthContext";

type NavItem = { label: string; href: string; hideOnMobile?: boolean };

const NAV: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "My Year at a Glance", href: "/yaag" },      // ✅ keep YAAG
  { label: "Community", href: "/community" },           // Durham city guide
  { label: "Student Lounge", href: "/lounge" },         // PQ’s new lounge
  { label: "Study Resources", href: "/resources" },
  { label: "Legal News", href: "/news" },
  { label: "About", href: "/about", hideOnMobile: true },
];

function cx(...cls: (string | false | null | undefined)[]) {
  return cls.filter(Boolean).join(" ");
}

function ActiveLink({ href, children }: { href: string; children: React.ReactNode }) {
  const router = useRouter();
  const active =
    router.pathname === href ||
    (href !== "/" && router.pathname.startsWith(href));

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cx(
        "px-3 py-2 rounded-md text-sm font-medium transition",
        active ? "bg-white/20 text-white" : "text-white/90 hover:text-white"
      )}
    >
      {children}
    </Link>
  );
}

export default function GlobalHeader() {
  const { user } = useAuth() || { user: null };
  const [open, setOpen] = useState(false);

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-violet-700 to-indigo-700 shadow">
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
            {NAV.map((n) => (
              <ActiveLink key={n.href} href={n.href}>
                {n.label}
              </ActiveLink>
            ))}
          </div>

          {/* Right side: Dashboard + Auth */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-3 py-2 rounded-md text-sm font-semibold bg-white text-indigo-700 hover:bg-indigo-50 transition"
              title="Open your dashboard"
            >
              My Dashboard
            </Link>
            {user ? (
              <span className="text-white/90 text-sm">
                Hi, {user.user_metadata?.full_name || user.email || "Student"}
              </span>
            ) : (
              <Link
                href="/login"
                className="text-white/90 hover:text-white text-sm"
                title="Sign in"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-white/90 hover:text-white"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? (
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
      {open && (
        <div className="md:hidden border-t border-white/10 bg-indigo-700/95 backdrop-blur">
          <div className="px-4 py-3 space-y-1">
            {NAV.filter((n) => !n.hideOnMobile).map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="block px-3 py-2 rounded-md text-sm text-white/90 hover:text-white hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                {n.label}
              </Link>
            ))}

            <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
              <Link
                href="/dashboard"
                className="px-3 py-2 rounded-md text-sm font-semibold bg-white text-indigo-700 hover:bg-indigo-50 transition"
                onClick={() => setOpen(false)}
              >
                My Dashboard
              </Link>
              {user ? (
                <span className="text-white/90 text-sm">
                  {user.user_metadata?.full_name || user.email || "Student"}
                </span>
              ) : (
                <Link
                  href="/login"
                  className="text-white/90 hover:text-white text-sm"
                  onClick={() => setOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
