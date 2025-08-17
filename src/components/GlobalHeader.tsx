// src/components/GlobalHeader.tsx
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { MAIN_NAV } from '@/config/nav'
import { useAuth } from '@/lib/supabase/AuthContext'

export default function GlobalHeader() {
  const router = useRouter()
  const { user, supabase } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)

  // Mark a tab active when current path starts with its href (except home)
  const isActive = (href: string) => {
    if (href === '/') return router.asPath === '/'
    return router.asPath === href || router.asPath.startsWith(href + '/')
  }

  const displayName = useMemo(() => {
    return (
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email?.split('@')[0] ||
      'Student'
    )
  }, [user?.user_metadata?.full_name, user?.user_metadata?.name, user?.email])

  const handleLogout = async () => {
    if (loggingOut) return
    try {
      setLoggingOut(true)
      await supabase?.auth.signOut()
      router.push('/')
    } catch (e) {
      console.error('Logout failed', e)
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-6">
        {/* Brand */}
        <Link
          href="/"
          className="font-extrabold text-xl flex items-center gap-2 whitespace-nowrap"
          aria-label="MyDurhamLaw Home"
        >
          <span aria-hidden>⚖️</span>
          <span>My</span>
          <span className="text-pink-300">Durham</span>
          <span>Law</span>
        </Link>

        {/* Primary nav */}
        <nav className="flex-1 overflow-x-auto">
          <ul className="flex items-center gap-3">
            {MAIN_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`px-3 py-1.5 rounded-md text-sm font-semibold transition ${
                    isActive(item.href) ? 'bg-white/20' : 'hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Auth / account area */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="hidden sm:inline-flex items-center rounded-md bg-white/10 px-3 py-1.5 text-sm font-semibold hover:bg-white/20"
                title="Go to your dashboard"
              >
                Hi, {displayName}
              </Link>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="inline-flex items-center rounded-md bg-white text-purple-700 px-3 py-1.5 text-sm font-semibold hover:bg-white/90 disabled:opacity-70"
                aria-label="Sign out"
              >
                {loggingOut ? 'Signing out…' : 'Logout'}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center rounded-md bg-white/10 px-3 py-1.5 text-sm font-semibold hover:bg-white/20"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center rounded-md bg-white text-purple-700 px-3 py-1.5 text-sm font-semibold hover:bg-white/90"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
