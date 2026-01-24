// src/components/GlobalFooter.tsx
import Link from 'next/link'
import { useMemo } from 'react'

import { BrandMark } from '@/components/brand/BrandMark'

export default function GlobalFooter() {
  const year = useMemo(() => new Date().getFullYear(), [])

  return (
    <footer className="mt-8 border-t bg-gray-50 border-gray-200">
      <div className="mx-auto max-w-7xl px-4 py-12 grid gap-8 md:grid-cols-4 text-sm">
        <div>
          <BrandMark variant="footer" />
          <div className="mt-4 space-y-2 text-gray-600 text-xs sm:text-sm max-w-xs">
            <p className="font-medium text-gray-900">Durmah Legal Eagle</p>
            <p>Empowering Durham Law students with ethical AI and emotional presence.</p>
          </div>
        </div>

        <div>
          <div className="font-semibold text-gray-900 mb-4 uppercase tracking-wider text-xs">Study & Progress</div>
          <ul className="space-y-2 text-gray-600">
            <li><Link className="hover:text-blue-600 transition-colors" href="/learn/ai-study-assistant">AI Study Assistant</Link></li>
            <li><Link className="hover:text-blue-600 transition-colors" href="/learn/smart-chat-interface">Smart Chat Tips</Link></li>
            <li><Link className="hover:text-blue-600 transition-colors" href="/learn/premium-support">Exam Excellence</Link></li>
            <li><Link className="hover:text-blue-600 transition-colors" href="/pricing">Plans & Pricing</Link></li>
          </ul>
        </div>

        <div>
          <div className="font-semibold text-gray-900 mb-4 uppercase tracking-wider text-xs">Community & Wellbeing</div>
          <ul className="space-y-2 text-gray-600">
            <li><Link className="hover:text-blue-600 transition-colors" href="/learn/always-with-you">AWY Wellbeing</Link></li>
            <li><Link className="hover:text-blue-600 transition-colors" href="/learn/real-time-collaboration">Study Groups</Link></li>
            <li><Link className="hover:text-blue-600 transition-colors" href="/community">Community Hub</Link></li>
            <li><Link className="hover:text-blue-600 transition-colors" href="/about">Our Story</Link></li>
          </ul>
        </div>

        <div>
          <div className="font-semibold text-gray-900 mb-4 uppercase tracking-wider text-xs">Legal & Safety</div>
          <ul className="space-y-2 text-gray-600">
            <li><Link className="hover:text-blue-600 transition-colors" href="/learn/academic-integrity">Academic Integrity</Link></li>
            <li><Link className="hover:text-blue-600 transition-colors" href="/legal/privacy-policy">Privacy Policy</Link></li>
            <li><Link className="hover:text-blue-600 transition-colors" href="/legal/terms-of-use">Terms of Use</Link></li>
            <li><Link className="hover:text-blue-600 transition-colors text-xs" href="/admin/login">Admin Login</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-gray-600">
          <p className="mb-2">
            MyDurhamLaw is an independent educational technology platform designed to support Durham Law students. 
            It is not affiliated with or endorsed by Durham University.
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
