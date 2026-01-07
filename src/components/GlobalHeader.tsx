// src/components/GlobalHeader.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
    href === '/dashboard'
      ? router.pathname === '/dashboard'
      : router.pathname === href ||
        (href !== '/' && router.pathname.startsWith(href + '/'));
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


function HoverMenu({
  label,
  items,
}: {
  label: string;
  items: MenuItem[];
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openNow = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const closeSoon = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 150); // small delay prevents flicker
  };

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  return (
    <div
      className="relative"
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
    >
      <button
        className="px-3 py-2 rounded-md text-sm font-medium text-white/90 hover:text-white"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {label}
      </button>

      {open && (
        <div
          className="absolute left-0 mt-2 w-56 rounded-xl border border-white/10 bg-white/95 shadow-2xl backdrop-blur"
          onMouseEnter={openNow}
          onMouseLeave={closeSoon}
        >
          <ul className="py-2">
            {items.map((it) => (
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
  );
}

import { X, User, Heart } from 'lucide-react';

// ... (existing imports)

export default function GlobalHeader() {
  const { user } = useAuth() || { user: null };
  const [openMobile, setOpenMobile] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const studyMenu: Menu = useMemo(
    () => ({
      label: 'Study',
      items: [
        { label: 'Year at a Glance', href: '/year-at-a-glance' },
        { label: 'Assignments', href: '/assignments' },
        { label: 'Research Hub', href: '/research-hub' },
      ],
    }),
    []
  );

  const communityMenu: Menu = useMemo(
    () => ({
      label: 'Community',
      items: [
        { label: 'Student Lounge', href: '/lounge' },
        { label: 'Community Hub', href: '/community' },
        { label: 'Legal News', href: '/legal/tools/legal-news-feed' },
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

  // Fetch actual display_name from profiles table
  const [displayName, setDisplayName] = useState<string>('Student');

  useEffect(() => {
    if (!user) {
      setDisplayName('Student');
      return;
    }

    const fetchDisplayName = async () => {
      try {
        const {getSupabaseClient} = await import('@/lib/supabase/client');
        const supabase = getSupabaseClient();
        if (!supabase) {
          setDisplayName(user.email?.split('@')[0] || 'Student');
          return;
        }

        const {data, error} = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single();

        if (data?.display_name) {
          setDisplayName(data.display_name);
        } else {
          setDisplayName(user.email?.split('@')[0] || 'Student');
        }
      } catch (err) {
        console.error('Failed to fetch display name:', err);
        setDisplayName(user.email?.split('@')[0] || 'Student');
      }
    };

    fetchDisplayName();
  }, [user]);

  return (
    <>
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
              <ActiveLink href="/dashboard" className="font-semibold">Dashboard</ActiveLink>
              <HoverMenu label={studyMenu.label} items={studyMenu.items} />
              <HoverMenu label={communityMenu.label} items={communityMenu.items} />
              <HoverMenu label={infoMenu.label} items={infoMenu.items} />
            </div>

            {/* Right (desktop) */}
            <div className="hidden md:flex items-center gap-3">
              <PresenceBadge />
              {user ? (
                <>
                  <span className="text-white/90 text-sm">Hi, {displayName}</span>
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
                  <Link href="/pricing" className="text-white/90 hover:text-white text-sm">Pricing</Link>
                  <Link href="/request-access" className="px-3 py-2 rounded-md text-sm font-semibold bg-white text-indigo-700 hover:bg-indigo-50 transition">
                    Start Free Trial
                  </Link>
                  <Link 
                    href="/login"
                    className="px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-white/10 transition border border-white/30"
                  >
                    Member Login
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
              {/* ... existing mobile menu items ... */}
              <div className="rounded-lg bg-white/5">
                <div className="px-3 py-2 text-white/80 text-xs">{user ? 'Account' : 'Get Started'}</div>
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
                        href="/request-access"
                        className="block px-4 py-2 text-sm text-indigo-700 bg-white rounded mx-3 mt-1 text-center font-semibold hover:bg-indigo-50"
                        onClick={() => setOpenMobile(false)}
                      >
                        Start Free Trial
                      </Link>
                      <Link
                        href="/login"
                        onClick={() => setOpenMobile(false)}
                        className="block px-4 py-2 text-sm text-white border border-white/30 rounded mx-3 mt-2 text-center font-medium hover:bg-white/10"
                      >
                        Member Login
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Welcome Back</h2>
            <p className="text-gray-500 text-center mb-8">Choose how you want to log in</p>
            
            <div className="space-y-4">
              <Link href="/request-access" onClick={() => setShowLoginModal(false)}>
                <div className="group flex items-center p-4 rounded-xl border border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                    <User size={24} />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-900 group-hover:text-purple-700">I'm a Student</h3>
                    <p className="text-sm text-gray-500">Access your dashboard & Durmah</p>
                  </div>
                </div>
              </Link>

              <Link href="/loved-one-login" onClick={() => setShowLoginModal(false)}>
                <div className="group flex items-center p-4 rounded-xl border border-gray-200 hover:border-pink-500 hover:bg-pink-50 transition-all cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 group-hover:scale-110 transition-transform">
                    <Heart size={24} />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-900 group-hover:text-pink-700">I'm a Loved One</h3>
                    <p className="text-sm text-gray-500">Check in on your student</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
