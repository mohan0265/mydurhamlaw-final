'use client'

import Link from 'next/link'

const LegalFooter = () => {
  return (
    <footer className="bg-gray-900 text-white py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <p className="mb-4">
          © 2024 MyDurhamLaw AI Study Assistant. Built with ❤️ for legal excellence. 
          Your intelligent companion for UK law mastery.
        </p>
        <div className="flex flex-wrap justify-center gap-6 text-sm">
          <Link href="/legal/ethics" className="text-blue-300 hover:text-blue-200 underline">
            Ethics
          </Link>
          <Link href="/legal/terms-of-use" className="text-blue-300 hover:text-blue-200 underline">
            Terms of Use
          </Link>
          <Link href="/legal/privacy-policy" className="text-blue-300 hover:text-blue-200 underline">
            Privacy Policy
          </Link>
          <Link href="/legal/cookie-policy" className="text-blue-300 hover:text-blue-200 underline">
            Cookie Policy
          </Link>
        </div>
      </div>
    </footer>
  )
}

export default LegalFooter