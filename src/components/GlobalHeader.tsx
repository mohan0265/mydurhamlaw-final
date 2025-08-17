'use client';

import Link from 'next/link';
import { useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '@/lib/supabase/AuthContext';
import { Search, Menu, X, ChevronDown, Heart } from 'lucide-react';
import { useUserDisplayName } from '@/hooks/useUserDisplayName';

/** Safe pathname helper that works during prerender and on the client */
function useSafePathname(): string {
  const [path, setPath] = useState<string>('');
  useEffect(() => {
    setPath(typeof window !== 'undefined' ? window.location?.pathname ?? '' : '');
  }, []);
  return path;
}

type NavItem = { href: string; label: string; external?: boolean };

const MAIN_LINKS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/planner/year-at-a-glance', label: 'My Year at a Glance' },
  { href: '/lounge', label: 'Premier Lounge' },
];

const ABOUT_LINKS: NavItem[] = [
  { href: '/vision-2035', label: 'Vision 2035' },
  { href: '/movement-pillars', label: 'Movement Pillars' },
  { href: '/csr-showcase', label: 'CSR Showcase' },
];

// Deduplicate by href (defensive)
const uniqueByHref = (links: NavItem[]) =>
  Array.from(new Map(links.map((l) => [l.href, l])).values());

export default function GlobalHeader() {
  const { user } = useContext(AuthContext) || {};
  const pathname = useSafePathname();
  const [open, setOpen] = useState(false);
  const [showAboutDropdown, setShowAboutDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { displayName } = useUserDisplayName();
  const router = useRouter();

  const LINKS = useMemo(() => uniqueByHref(MAIN_LINKS), []);
  const ABOUT = useMemo(() => uniqueByHref(ABOUT_LINKS), []);
  
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isHomepage = pathname === '/';

  return (
    <header className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${
      isHomepage 
        ? 'border-white/20 bg-black/60 backdrop-blur-lg' 
        : 'border-gray-200 bg-white/80 backdrop-blur'
    }`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo/Brand */}
        <Link href="/" className="flex items-center gap-2 font-semibold transition-colors hover:opacity-80">
          {user && displayName ? (
            <div className="flex items-center gap-2">
              <Heart className={`h-5 w-5 ${
                isHomepage ? 'text-pink-400' : 'text-emerald-600'
              }`} />
              <span className={`text-xl ${
                isHomepage ? 'text-white' : 'text-gray-900'
              }`}>Durham Law</span>
              <span className={`text-lg font-medium ${
                isHomepage ? 'text-pink-200' : 'text-emerald-600'
              }`}>{displayName}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className={`text-xl ${
                isHomepage ? 'text-white' : 'text-gray-900'
              }`}>My</span>
              <span className={`text-xl ${
                isHomepage ? 'text-emerald-400' : 'text-emerald-600'
              }`}>Durham</span>
              <span className={`text-xl ${
                isHomepage ? 'text-white' : 'text-gray-900'
              }`}>Law</span>
            </div>
          )}
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6">
          {resolvedLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition-colors ${
                isActive(l.href) 
                  ? (isHomepage ? 'text-emerald-400' : 'text-emerald-600')
                  : (isHomepage ? 'text-white hover:text-emerald-300' : 'text-gray-600 hover:text-gray-900')
              }`}
            >
              {l.label}
            </Link>
          ))}
          
          {/* About Dropdown */}
          <div className="relative">
            <button
              onMouseEnter={() => setShowAboutDropdown(true)}
              onMouseLeave={() => setShowAboutDropdown(false)}
              className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                isHomepage ? 'text-white hover:text-emerald-300' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              About
              <ChevronDown className="h-4 w-4" />
            </button>
            
            {showAboutDropdown && (
              <div 
                className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2"
                onMouseEnter={() => setShowAboutDropdown(true)}
                onMouseLeave={() => setShowAboutDropdown(false)}
              >
                {ABOUT.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Search Bar (Desktop) */}
        <div className="hidden md:block">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="search"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-64 px-4 py-2 pr-10 rounded-full text-sm transition-all focus:outline-none focus:ring-2 ${
                isHomepage 
                  ? 'bg-white/10 border border-white/20 text-white placeholder-white/70 focus:bg-white/20 focus:ring-emerald-400'
                  : 'bg-gray-100 border border-gray-200 text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-emerald-500'
              }`}
            />
            <Search className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 ${
              isHomepage ? 'text-white/70' : 'text-gray-400'
            }`} />
          </form>
        </div>

        {/* User Menu / Auth (Desktop) */}
        <div className="hidden md:block">
          {user ? (
            <div className="flex items-center gap-3">
              <span className={`text-sm ${
                isHomepage ? 'text-white/80' : 'text-gray-600'
              }`}>
                Hi, {user.email?.split('@')[0] || 'student'}
              </span>
              <Link
                href="/settings"
                className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  isHomepage 
                    ? 'text-white border border-white/30 hover:bg-white/10'
                    : 'text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Settings
              </Link>
            </div>
          ) : (
            <Link
              href="/signup"
              className="rounded-lg bg-gradient-to-r from-emerald-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white hover:from-emerald-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105"
            >
              Sign in
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          aria-label="Toggle menu"
          className={`inline-flex items-center rounded-md p-2 lg:hidden transition-colors ${
            isHomepage 
              ? 'text-white border border-white/30 hover:bg-white/10'
              : 'text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className={`border-t lg:hidden ${
          isHomepage ? 'border-white/20 bg-black/80' : 'border-gray-200 bg-white'
        }`}>
          <nav className="mx-auto flex max-w-6xl flex-col px-4 py-3">
            {/* Search (Mobile) */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <input
                  type="search"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full px-4 py-2 pr-10 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 ${
                    isHomepage 
                      ? 'bg-white/10 border border-white/20 text-white placeholder-white/70 focus:bg-white/20 focus:ring-emerald-400'
                      : 'bg-gray-100 border border-gray-200 text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-emerald-500'
                  }`}
                />
                <Search className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 ${
                  isHomepage ? 'text-white/70' : 'text-gray-400'
                }`} />
              </div>
            </form>

            {/* Main Navigation */}
            <div className="space-y-2">
              {resolvedLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive(l.href) 
                      ? (isHomepage ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-50 text-emerald-700')
                      : (isHomepage ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-50')
                  }`}
                >
                  {l.label}
                </Link>
              ))}
              
              {/* About Links */}
              <div className={`border-t pt-2 mt-2 ${
                isHomepage ? 'border-white/20' : 'border-gray-200'
              }`}>
                <div className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide ${
                  isHomepage ? 'text-white/60' : 'text-gray-500'
                }`}>
                  About
                </div>
                {ABOUT.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive(item.href) 
                        ? (isHomepage ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-50 text-emerald-700')
                        : (isHomepage ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-50')
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* User Section (Mobile) */}
            <div className={`pt-4 mt-4 border-t ${
              isHomepage ? 'border-white/20' : 'border-gray-200'
            }`}>
              {user ? (
                <div className="space-y-2">
                  <div className={`px-3 py-2 text-sm ${
                    isHomepage ? 'text-white/80' : 'text-gray-600'
                  }`}>
                    Hi, {user.email?.split('@')[0] || 'student'}
                  </div>
                  <Link
                    href="/settings"
                    onClick={() => setOpen(false)}
                    className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isHomepage ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Settings
                  </Link>
                </div>
              ) : (
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="inline-block rounded-lg bg-gradient-to-r from-emerald-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white hover:from-emerald-700 hover:to-blue-700 transition-all duration-300"
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