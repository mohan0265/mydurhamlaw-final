// src/components/GlobalFooter.tsx
import Link from 'next/link'
import { useMemo } from 'react'

export default function GlobalFooter() {
  const year = useMemo(() => new Date().getFullYear(), [])

  return (
    <footer className="mt-16 border-t bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-10 grid gap-8 md:grid-cols-3 text-sm">
        <div>
          <div className="font-extrabold text-lg mb-2">
            <span className="mr-1">⚖️</span>
            My<span className="text-pink-600">Durham</span>Law
          </div>
          <div className="space-y-2 text-gray-600 text-xs sm:text-sm">
            <p>Durmah - Your Legal Eagle AI Mentor</p>
            <p>Always With You - Emotional presence for Durham Law students and their loved ones.</p>
          </div>
        </div>

        <div>
          <div className="font-semibold mb-2">Quick Links</div>
          <ul className="space-y-1 text-gray-700">
            <li><Link className="hover:underline" href="/about">About</Link></li>
            <li><Link className="hover:underline" href="/study-schedule">Study Schedule</Link></li>
            <li><Link className="hover:underline" href="/research-hub">Research Hub</Link></li>
          </ul>
        </div>

        <div>
          <div className="font-semibold mb-2">Legal & Contact</div>
          <ul className="space-y-1 text-gray-700">
            <li><Link className="hover:underline" href="/legal/privacy-policy">Privacy Policy</Link></li>
            <li><Link className="hover:underline" href="/legal/terms-of-use">Terms of Use</Link></li>
            <li><Link className="hover:underline" href="/legal/ethics">Ethics & AI Integrity</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-gray-600">
          <p className="mb-2">
            Important: MyDurhamLaw is not affiliated with Durham University. This platform provides
            AI-powered academic assistance for educational enrichment only.
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span>© {year} MyDurhamLaw. All rights reserved.</span>
            <span>
              Read our{' '}
              <Link href="/legal/ethics" className="underline text-gray-700 hover:text-gray-900">
                Ethics & Academic Integrity guidelines
              </Link>
              .
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
