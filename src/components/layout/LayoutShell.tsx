'use client'

import React, { useContext } from 'react'
import { useRouter } from 'next/router'
import GlobalHeader from '@/components/GlobalHeader'
import ResponsiveSidebar from '@/components/layout/ResponsiveSidebar'
import AppFooter from '@/components/layout/AppFooter'
import MarketingFooter from '@/components/layout/MarketingFooter'
import { AuthContext } from '@/lib/supabase/AuthContext'

interface LayoutShellProps {
  children: React.ReactNode
  showSidebar?: boolean
  footerType?: 'app' | 'marketing' | 'none' | 'auto'
}

const LayoutShell: React.FC<LayoutShellProps> = ({ 
  children, 
  showSidebar = true, 
  footerType = 'auto' 
}) => {
  const router = useRouter()
  const { user } = useContext(AuthContext) || {}

  // Determine footer type based on route if set to auto
  const getFooterType = (): 'app' | 'marketing' | 'none' => {
    if (footerType !== 'auto') return footerType

    const pathname = router.pathname
    
    // No footer on login/signup pages
    if (pathname === '/login' || pathname === '/signup') {
      return 'none'
    }
    
    // App footer for authenticated app pages
    if (pathname.startsWith('/dashboard') || 
        pathname.startsWith('/assignments') || 
        pathname.startsWith('/lounge') ||
        pathname.startsWith('/tools') ||
        pathname.startsWith('/wellbeing') ||
        pathname.startsWith('/research-hub') ||
        pathname.startsWith('/study-schedule') ||
        pathname.startsWith('/calendar') ||
        pathname.startsWith('/settings') ||
        pathname.startsWith('/onboarding')) {
      return 'app'
    }
    
    // Marketing footer for public pages
    return 'marketing'
  }

  const finalFooterType = getFooterType()

  const renderFooter = () => {
    switch (finalFooterType) {
      case 'app':
        return <AppFooter />
      case 'marketing':
        return <MarketingFooter />
      case 'none':
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Global Header with fixed z-index */}
      <GlobalHeader />
      
      <div className="flex flex-1 relative">
        {/* Sidebar */}
        {showSidebar && <ResponsiveSidebar />}
        
        {/* Main content area */}
        <main 
          className={`
            flex-1 flex flex-col transition-all duration-300 ease-in-out
            ${router.pathname === '/' ? '' : 'pt-4 pb-8 px-4 sm:px-6'}
            ${showSidebar ? 'lg:ml-[var(--sidebar-width)]' : ''}
          `}
        >
          <div className={`flex-1 w-full ${
            router.pathname === '/' ? '' : 'max-w-7xl mx-auto'
          }`}>
            {children}
          </div>
        </main>
      </div>
      
      {/* Footer */}
      {renderFooter()}
    </div>
  )
}

export default LayoutShell