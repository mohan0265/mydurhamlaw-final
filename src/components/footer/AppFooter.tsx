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
    <ul className="space-y-3">
      {links.map((link, idx) => (
        <li key={idx}>
          {link.disabled ? (
            <span className="text-gray-500 cursor-not-allowed flex items-center text-sm">
              {link.icon || null}
              {link.label}
              <span className="ml-2 text-[10px] uppercase bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">Soon</span>
            </span>
          ) : (
            <Link 
              href={link.href} 
              className="text-gray-300 hover:text-blue-400 transition-colors duration-200 flex items-center text-sm group"
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
    <footer className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* Col 1: Brand */}
          <div className="md:col-span-1">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4 flex items-center gap-2">
              <Scale className="w-6 h-6 text-yellow-400" />
              MyDurhamLaw
            </h3>
            <p className="text-gray-300 mb-6 leading-relaxed text-sm">
              The ethical AI study companion built exclusively for Durham University Law students. 
              Transforming legal education with integrity, intelligence, and care.
            </p>
            <div className="flex space-x-4">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-pink-400" />
              </div>
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-purple-400" />
              </div>
            </div>
          </div>

          {/* Col 2: Primary Links (Context Aware) */}
          <div>
            <h4 className="text-lg font-bold mb-6 text-white border-b border-white/10 pb-2 inline-block">
              {isAuthed ? 'Study & Progress' : 'Explore'}
            </h4>
            {isAuthed ? renderLinks(studentStudyLinks) : renderLinks(publicLearnLinks)}
          </div>

          {/* Col 3: Secondary Links (Context Aware) */}
          <div>
            <h4 className="text-lg font-bold mb-6 text-white border-b border-white/10 pb-2 inline-block">
              {isAuthed ? 'Community' : 'Support'}
            </h4>
            {isAuthed ? renderLinks(studentCommunityLinks) : (
               <ul className="space-y-3">
                 <li><Link href="/help" className="text-gray-300 hover:text-blue-400 text-sm">Help Center</Link></li>
                 <li><Link href="/contact" className="text-gray-300 hover:text-blue-400 text-sm">Contact Us</Link></li>
                 <li><span className="text-gray-500 text-sm cursor-not-allowed">Live Chat (Coming Soon)</span></li>
               </ul>
            )}
          </div>

          {/* Col 4: Legal & Contact (Always visible) */}
          <div>
            <h4 className="text-lg font-bold mb-6 text-white border-b border-white/10 pb-2 inline-block">
              Legal & Safety
            </h4>
            {renderLinks(legalLinks)}
            
            <div className="mt-6 pt-6 border-t border-white/10">
               <a href="mailto:support@mydurhamlaw.com" className="text-gray-300 hover:text-blue-400 transition-colors duration-200 flex items-center text-sm">
                  <Mail className="w-4 h-4 mr-2" />
                  support@mydurhamlaw.com
               </a>
            </div>
          </div>

        </div>

        {/* Disclaimer Notice */}
        <div className="bg-blue-500/10 backdrop-blur-sm rounded-xl p-6 border border-blue-400/20 mb-8">
          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
            <div>
              <h5 className="font-semibold text-blue-300 mb-2 text-sm uppercase tracking-wider">Independent Development Notice</h5>
              <p className="text-blue-100 text-xs leading-relaxed">
                MyDurhamLaw is independently developed and is not affiliated with, endorsed by, or officially 
                connected to Durham University or its law faculty. All university trademarks and content 
                remain the property of their respective owners. We are a third-party educational technology 
                service designed to support Durham Law students.
              </p>
            </div>
          </div>
        </div>

        {/* SEO Keywords (Public Only) */}
        {!isAuthed && (
          <div className="border-t border-gray-700 pt-8 mb-8">
            <h5 className="text-xs font-semibold text-gray-500 mb-4 uppercase tracking-wider">Popular Topics</h5>
            <div className="flex flex-wrap gap-2">
              {seoLinks.map((link, i) => (
                 <Link 
                   key={i} 
                   href={link.href} 
                   className="text-[10px] text-gray-400 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors"
                 >
                   {link.label}
                 </Link>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center text-sm">
          <p className="text-gray-500 mb-4 md:mb-0 text-center md:text-left">
            © {new Date().getFullYear()} MyDurhamLaw. Built with care for legal excellence. All rights reserved.
          </p>
          
          <div className="flex items-center space-x-6">
            {!isAuthed && (
              <Link href="/signup" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full transition-all text-sm font-medium border border-white/10">
                Start Free Trial
              </Link>
            )}
            <Link href="/sitemap.xml" className="text-gray-500 hover:text-white transition-colors">
              Sitemap
            </Link>
          </div>
        </div>

      </div>
    </footer>
  )
}
