'use client'

import React, { useContext } from 'react'
import { useRouter } from 'next/router'
import GlobalHeader from '@/components/GlobalHeader'
import GlobalFooter from '@/components/GlobalFooter'
import ResponsiveSidebar from '@/components/layout/ResponsiveSidebar'
import { AuthContext } from '@/lib/supabase/AuthContext'

interface LayoutShellProps {
  children: React.ReactNode
  showSidebar?: boolean
  showFooter?: boolean
}

const LayoutShell: React.FC<LayoutShellProps> = ({ 
  children, 
  showSidebar = true, 
  showFooter = true 
}) => {
  const router = useRouter()
  const { user } = useContext(AuthContext) || {}

  // Determine if footer should be shown based on route
  const shouldShowFooter = (): boolean => {
    if (!showFooter) return false

    const pathname = router.pathname
    
    // No footer on login/signup pages
    if (pathname === '/login' || pathname === '/signup') {
      return false
    }
    
    // Show footer on all other pages
    return true
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
      {shouldShowFooter() && <GlobalFooter />}
    </div>
  )
}

export default LayoutShell