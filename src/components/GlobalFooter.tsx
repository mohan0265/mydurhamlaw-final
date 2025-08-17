// src/components/GlobalFooter.tsx
import Link from 'next/link'

export default function GlobalFooter() {
  return (
    <footer className="mt-16 border-t bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 grid gap-8 md:grid-cols-3 text-sm">
        <div>
          <div className="font-bold text-lg mb-2">⚖️ My<span className="text-pink-600">Durham</span>Law</div>
          <p className="text-gray-600">Supporting MyDurhamLaw students with tools for academic excellence and personal wellbeing.</p>
        </div>
        <div>
          <div className="font-semibold mb-2">Quick Links</div>
          <ul className="space-y-1 text-gray-700">
            <li><Link href="/about">About</Link></li>
            <li><Link href="/study-schedule">Study Schedule</Link></li>
            <li><Link href="/research-hub">Research Hub</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-2">Legal & Contact</div>
          <ul className="space-y-1 text-gray-700">
            <li><Link href="/legal/privacy-policy">Privacy Policy</Link></li>
            <li><Link href="/legal/terms-of-use">Terms of Use</Link></li>
            <li><Link href="/legal/ethics">Ethics & AI Integrity</Link></li>
          </ul>
        </div>
      </div>
      <div className="text-xs text-gray-500 text-center pb-8 px-4 max-w-5xl mx-auto">
        Important: MyDurhamLaw is not affiliated with Durham University. AI responses are for academic guidance only.
      </div>
    </footer>
  )
}