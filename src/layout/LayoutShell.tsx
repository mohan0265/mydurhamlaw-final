// src/layout/LayoutShell.tsx
import React from 'react'
import { useRouter } from 'next/router'
import GlobalHeader from '@/components/GlobalHeader'
import GlobalFooter from '@/components/GlobalFooter'
import dynamic from 'next/dynamic'
// Dynamic imports to avoid SSR issues with Voice/WebRTC
const DurmahWidget = dynamic(() => import('@/components/DurmahWidget'), { ssr: false })
const AWYWidget = dynamic(() => import('@/components/awy/AWYWidget'), { ssr: false })
import { CalendarProvider } from '@/context/CalendarContext'

type Props = { children: React.ReactNode }

export default function LayoutShell({ children }: Props) {
  const router = useRouter()

  // Only the home page is full-bleed; everything else is constrained
  const fullBleedPrefixes = ['/']

  const isFullBleed = fullBleedPrefixes.some(
    (p) => router.pathname === p || router.pathname.startsWith(p + '/')
  )

  const isAuthPage = ['/login', '/signup', '/auth/redirect'].includes(router.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-gray-50">
      {/* Accessible skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[9999] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:shadow"
      >
        Skip to content
      </a>

      <GlobalHeader />

      {/* Calendar state available to all pages */}
      <CalendarProvider>
        <main id="main-content" className="flex-1">
          {isFullBleed ? (
            children
          ) : (
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          )}
        </main>
      </CalendarProvider>

      <GlobalFooter />
      
      {/* Global Floating Widgets - Show on all pages except auth pages and setup */}
      {!isAuthPage && !router.pathname.startsWith('/setup') && (
        <>
          <DurmahWidget />
          <AWYWidget />
        </>
      )}
    </div>
  )
}
