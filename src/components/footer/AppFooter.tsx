'use client'

import React from 'react'
import Link from 'next/link'
import { Shield, Heart, BookOpen, Mail, MapPin, ExternalLink, Lock, HelpCircle, Users, Scale, GraduationCap } from 'lucide-react'

interface AppFooterProps {
  isAuthed: boolean
}

type FooterLink = {
  label: string
  href: string
  icon?: React.ReactNode
  disabled?: boolean
  isExternal?: boolean
}

export const AppFooter: React.FC<AppFooterProps> = ({ isAuthed }) => {
  
  // -- LINK CONFIGURATIONS --

  // 1. Legal Links (Common to everyone)
  const legalLinks: FooterLink[] = [
    { label: "Ethics Policy", href: "/legal/ethics", icon: <Shield className="w-4 h-4 mr-2" /> },
    { label: "Terms of Use", href: "/legal/terms-of-use" },
    { label: "Privacy Policy", href: "/legal/privacy-policy" },
    { label: "Cookie Policy", href: "/legal/cookie-policy" },
    { label: "Academic Integrity", href: "/legal/academic-integrity" },
  ]

  // 2. Public Column A: Learn & Explore (Public)
  const publicLearnLinks: FooterLink[] = [
    { label: "Pricing", href: "/pricing" },
    { label: "About Us", href: "/about" },
    { label: "Request Access", href: "/request-access" },
    { label: "Support", href: "/support" },
    { label: "Legal News Feed", href: "/legal/tools/legal-news-feed" },
    { label: "Research Hub", href: "/legal/research", disabled: false }, // Assuming exists per prompt
  ]

  // 3. Student Column A: Study & Progress (Authed)
  const studentStudyLinks: FooterLink[] = [
    { label: "Dashboard", href: "/dashboard", icon: <BookOpen className="w-4 h-4 mr-2" /> },
    { label: "Year at a Glance", href: "/year-at-a-glance" },
    { label: "Assignments", href: "/assignments" },
    { label: "My Lectures", href: "/study/lectures" }, // changed to /study/lectures based on header usage
    { label: "Exam Prep", href: "/exam-prep" },
  ]

  // 4. Student Column B: Community & Wellbeing (Authed)
  const studentCommunityLinks: FooterLink[] = [
    { label: "Community Hub", href: "/community", icon: <Users className="w-4 h-4 mr-2" /> },
    { label: "Wellbeing Coach", href: "/wellbeing", icon: <Heart className="w-4 h-4 mr-2" /> },
    { label: "Refer a Friend", href: "/refer" },
    { label: "Manage Billing", href: "/billing" },
  ]

  // 5. SEO Links (Public Only - Bottom)
  const seoLinks = [
    { label: "Durham Law Study Guide", href: "/durham-law-study-guide" },
    { label: "UK Law Degree Help", href: "/uk-law-degree-help" },
    { label: "Legal Assignment Assistance", href: "/legal-assignment-assistance" },
    { label: "Law Student Wellbeing", href: "/wellbeing" }, // Wellbeing is mostly public-ish marketing page anyway? Or maybe restricted. Keeping as in EnhancedFooter.
  ]

  // Helper to render a link list
  const renderLinks = (links: FooterLink[]) => (
    <ul className="space-y-2">
      {links.map((link, idx) => (
        <li key={idx}>
          {link.disabled ? (
            <span className="text-gray-500 cursor-not-allowed flex items-center text-xs">
              {link.icon || null}
              {link.label}
              <span className="ml-2 text-[10px] uppercase bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">Soon</span>
            </span>
          ) : (
            <Link 
              href={link.href} 
              className="text-gray-300 hover:text-blue-400 transition-colors duration-200 flex items-center text-xs group"
              target={link.isExternal ? "_blank" : undefined}
            >
              {link.icon || null}
              {link.label}
              {link.isExternal && <ExternalLink className="w-3 h-3 ml-1 opacity-50" />}
            </Link>
          )}
        </li>
      ))}
    </ul>
  )

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Col 1: Brand */}
          <div className="md:col-span-1">
            <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-3 flex items-center gap-2">
              <Scale className="w-5 h-5 text-yellow-400" />
              MyDurhamLaw
            </h3>
            <p className="text-gray-300 mb-4 leading-relaxed text-xs">
              MyDurhamLaw is an independent study companion designed around the Durham Law journey.
              Transforming legal education with integrity.
            </p>
            {/* ... items ... */}
          </div>

          {/* ... columns ... */}

        </div>

        {/* Disclaimer Notice */}
        <div className="bg-blue-500/10 backdrop-blur-sm rounded-lg p-4 border border-blue-400/20 mb-6">
          <div className="flex items-start space-x-3">
            <MapPin className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h5 className="font-semibold text-blue-300 mb-1 text-[10px] uppercase tracking-wider">Independent study companion</h5>
              <p className="text-blue-100 text-[10px] leading-relaxed">
                Built for Durham Law students. MyDurhamLaw is an independent study companion designed around the Durham Law journey. 
                Not affiliated with or endorsed by Durham University.
              </p>
            </div>
          </div>
        </div>

        {/* SEO Keywords (Public Only) */}
        {!isAuthed && (
          <div className="border-t border-gray-700 pt-4 mb-6">
            <h5 className="text-[10px] font-semibold text-gray-500 mb-2 uppercase tracking-wider">Popular Topics</h5>
            <div className="flex flex-wrap gap-2">
              {seoLinks.map((link, i) => (
                 <Link 
                   key={i} 
                   href={link.href} 
                   className="text-[10px] text-gray-400 bg-white/5 hover:bg-white/10 px-2 py-1 rounded transition-colors"
                 >
                   {link.label}
                 </Link>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 pt-6 flex flex-col md:flex-row justify-between items-center text-xs">
          <p className="text-gray-500 mb-3 md:mb-0 text-center md:text-left">
            © {new Date().getFullYear()} MyDurhamLaw. Built with care for legal excellence.
          </p>
          
          <div className="flex items-center space-x-4">
            {!isAuthed && (
              <Link href="/signup" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full transition-all text-xs font-medium border border-white/10">
                Start Free Trial
              </Link>
            )}
            <a href="/sitemap.xml" className="text-gray-500 hover:text-white transition-colors">
              Sitemap
            </a>
          </div>
        </div>

      </div>
    </footer>
  )
}
