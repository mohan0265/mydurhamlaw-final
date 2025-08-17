// src/components/GlobalHeader.tsx
import Link from 'next/link'
import { useRouter } from 'next/router'
import { MAIN_NAV } from '@/config/nav'

export default function GlobalHeader() {
  const router = useRouter()

  return (
    <header className="sticky top-0 z-40 w-full bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-6">
        <Link href="/" className="font-extrabold text-xl flex items-center gap-2 whitespace-nowrap">
          <span>⚖️</span>
          <span>My</span>
          <span className="text-pink-300">Durham</span>
          <span>Law</span>
        </Link>
        <nav className="flex-1 overflow-x-auto">
          <ul className="flex items-center gap-3">
            {MAIN_NAV.map(item => {
              const active = router.pathname === item.href || router.asPath === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`px-3 py-1.5 rounded-md text-sm font-semibold transition ${
                      active ? 'bg-white/20' : 'hover:bg-white/10'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </header>
  )
}