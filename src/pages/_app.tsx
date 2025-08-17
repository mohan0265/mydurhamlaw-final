// src/pages/_app.tsx
import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { validateEnv } from '@/lib/env'
import { AuthProvider } from '@/lib/supabase/AuthContext'
import { Toaster } from 'react-hot-toast'
import dynamic from 'next/dynamic'
import { DurmahProvider } from '@/context/DurmahContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LayoutShell from '@/components/layout/LayoutShell'

// DO NOT auto-initialize RSS on the server during build/runtime via _app.tsx
// (It was causing cron to start during `next build` and spamming logs.)

const DynamicDurmahWidget = dynamic(() => import('@/components/DurmahWidget'), { ssr: false })
const DynamicAwyBootstrap = dynamic(() => import('@/components/AWYBootstrap'), { ssr: false })

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 300_000, retry: 1, refetchOnWindowFocus: false },
          mutations: { retry: 1 },
        },
      })
  )

  useEffect(() => {
    try {
      validateEnv()
    } catch (error) {
      console.error('Environment validation failed:', error)
    }
  }, [])

  useEffect(() => {
    const handleRouteChange = () => {
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
      }
    }
    handleRouteChange()
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])

  // Determine if we should show sidebar based on route
  const shouldShowSidebar = () => {
    const pathname = router.pathname
    // Don't show sidebar on homepage and auth pages
    if (pathname === '/' || pathname === '/login' || pathname === '/signup' || pathname === '/about') {
      return false
    }
    return true
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DurmahProvider>
          <LayoutShell showSidebar={shouldShowSidebar()}>
            <Component {...pageProps} />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: { background: '#363636', color: '#fff', zIndex: 9999 },
                success: { duration: 3000, iconTheme: { primary: '#10b981', secondary: '#fff' } },
                error: { duration: 5000, iconTheme: { primary: '#ef4444', secondary: '#fff' } },
              }}
            />
            {/* Durmah and AWY widgets with high z-index to stay above sidebar */}
            <div style={{ zIndex: 60 }}>
              <DynamicDurmahWidget />
              <DynamicAwyBootstrap />
            </div>
          </LayoutShell>
        </DurmahProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
