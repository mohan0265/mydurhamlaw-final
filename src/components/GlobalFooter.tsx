'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, Github, Twitter } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

const GlobalFooter: React.FC = () => {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-gray-50 text-gray-700 text-sm mt-8 sm:mt-12 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          
          {/* Brand & Logo */}
          <div className="flex flex-col space-y-3 sm:space-y-4 sm:col-span-2 lg:col-span-1">
            <Logo variant="dark" size="sm" href="/" className="self-start" />
            <p className="text-xs text-gray-600 leading-relaxed">
              Supporting MyDurhamLaw students with tools for academic excellence and personal wellbeing.
            </p>
            <p className="text-xs text-gray-500">
              &copy; {year} MyDurhamLaw. All rights reserved.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-2 sm:mb-3 text-sm">Quick Links</h4>
            <div className="space-y-1 sm:space-y-2">
              <Link href="/about" className="block text-gray-600 hover:text-purple-700 hover:underline transition-colors text-xs sm:text-sm min-h-[44px] sm:min-h-0 flex items-center sm:block py-2 sm:py-0">
                About
              </Link>
              <Link href="/study-schedule" className="block text-gray-600 hover:text-purple-700 hover:underline transition-colors text-xs sm:text-sm min-h-[44px] sm:min-h-0 flex items-center sm:block py-2 sm:py-0">
                Study Schedule
              </Link>
              <Link href="/research-hub" className="block text-gray-600 hover:text-purple-700 hover:underline transition-colors text-xs sm:text-sm min-h-[44px] sm:min-h-0 flex items-center sm:block py-2 sm:py-0">
                Research Hub
              </Link>
            </div>
          </div>

          {/* Tools */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-2 sm:mb-3 text-sm">Tools</h4>
            <div className="space-y-1 sm:space-y-2">
              <Link href="/assignments" className="block text-gray-600 hover:text-purple-700 hover:underline transition-colors text-xs sm:text-sm min-h-[44px] sm:min-h-0 flex items-center sm:block py-2 sm:py-0">
                Assignment Assistant
              </Link>
              <Link href="/tools/memory-manager" className="block text-gray-600 hover:text-purple-700 hover:underline transition-colors text-xs sm:text-sm min-h-[44px] sm:min-h-0 flex items-center sm:block py-2 sm:py-0">
                Reflect & Grow
              </Link>
              <Link href="/wellbeing" className="block text-gray-600 hover:text-purple-700 hover:underline transition-colors text-xs sm:text-sm min-h-[44px] sm:min-h-0 flex items-center sm:block py-2 sm:py-0">
                <span className="sm:hidden">Durmah</span>
                <span className="hidden sm:inline">Durmah (Wellbeing Companion)</span>
              </Link>
            </div>
          </div>

          {/* Legal & Contact */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h4 className="font-semibold text-gray-800 mb-2 sm:mb-3 text-sm">Legal & Contact</h4>
            <div className="space-y-1 sm:space-y-2">
              <Link href="/legal/privacy-policy" className="block text-gray-600 hover:text-purple-700 hover:underline transition-colors text-xs sm:text-sm min-h-[44px] sm:min-h-0 flex items-center sm:block py-2 sm:py-0">
                Privacy Policy
              </Link>
              <Link href="/legal/terms-of-use" className="block text-gray-600 hover:text-purple-700 hover:underline transition-colors text-xs sm:text-sm min-h-[44px] sm:min-h-0 flex items-center sm:block py-2 sm:py-0">
                Terms of Use
              </Link>
              <Link href="/ethics" className="block text-gray-600 hover:text-purple-700 hover:underline transition-colors text-xs sm:text-sm min-h-[44px] sm:min-h-0 flex items-center sm:block py-2 sm:py-0">
                <span className="sm:hidden">Ethics & AI</span>
                <span className="hidden sm:inline">Ethics & AI Integrity</span>
              </Link>
              <Link href="/legal/cookie-policy" className="block text-gray-600 hover:text-purple-700 hover:underline transition-colors text-xs sm:text-sm min-h-[44px] sm:min-h-0 flex items-center sm:block py-2 sm:py-0">
                Cookie Policy
              </Link>
            </div>
            
            {/* Social Icons Placeholder */}
            <div className="mt-3 sm:mt-4 flex space-x-3">
              <button className="text-gray-400 hover:text-purple-700 transition-colors p-2 sm:p-1 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center" title="Contact us">
                <Mail className="w-4 h-4" />
              </button>
              <button className="text-gray-400 hover:text-purple-700 transition-colors p-2 sm:p-1 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center" title="GitHub">
                <Github className="w-4 h-4" />
              </button>
              <button className="text-gray-400 hover:text-purple-700 transition-colors p-2 sm:p-1 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center" title="Twitter">
                <Twitter className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Disclaimer - Enhanced */}
        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 space-y-2 sm:space-y-3">
          <p className="text-xs text-gray-500 text-center leading-relaxed">
            <strong>Important:</strong> MyDurhamLaw is not affiliated with Durham University. 
            This platform provides AI-powered academic assistance for educational enrichment only.
          </p>
          <p className="text-xs text-gray-500 text-center leading-relaxed">
            <strong>AI Disclaimer:</strong> All AI responses are for academic guidance only and should not be considered as legal advice or official university guidance.
            Always consult official course materials or your lecturer for authoritative information.
          </p>
          <p className="text-xs text-gray-400 text-center">
            Read our <Link href="/ethics" className="underline hover:text-purple-600 min-h-[44px] inline-flex items-center px-1 -mx-1">Ethics & Academic Integrity guidelines</Link> for more information.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default GlobalFooter