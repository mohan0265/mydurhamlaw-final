// src/pages/_app.tsx
import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { validateEnv } from '@/lib/env'
import { AuthProvider } from '@/lib/supabase/AuthContext'
// Voice system now consolidated into DurmahContext
// import { VoiceManagerProvider } from '@/lib/context/VoiceManagerContext' // Removed - using DurmahContext
import { Toaster } from 'react-hot-toast'
import dynamic from 'next/dynamic'
import { DurmahProvider } from '@/context/DurmahContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LayoutShell from '@/components/layout/LayoutShell'

// Initialize RSS system on server startup
if (typeof window === 'undefined') {
  import('@/lib/rss/init')
    .then(({ initializeRSSSystem }) => {
      // Small delay to ensure all modules are loaded
      setTimeout(() => {
        initializeRSSSystem()
      }, 3000) // 3 second delay
    })
    .catch(error => {
      console.error('Failed to import RSS initialization:', error)
    })
}

// Durmah Voice widget: client-side only
const DynamicDurmahWidget = dynamic(() => import('@/components/voice/DurmahWidget').then(mod => ({ default: mod.DurmahWidget })), { ssr: false })

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 300_000, retry: 1, refetchOnWindowFocus: false },
      mutations: { retry: 1 },
    },
  }))

  useEffect(() => {
    try {
      validateEnv()
    } catch (error) {
      console.error('Environment validation failed:', error)
    }
  }, [])

  useEffect(() => {
    const handleRouteChange = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
    }

    handleRouteChange()
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])

  // Determine if we should use LayoutShell for this page
  const shouldUseLayout = () => {
    const pathname = router.pathname
    
    // Pages that should NOT use the global layout (they handle their own layout)
    const noLayoutPages = [
      '/dashboard/year1',
      '/dashboard/year2', 
      '/dashboard/year3',
      '/dashboard/foundation',
      '/dashboard'
    ]
    
    // Check if the current page is in the no-layout list
    return !noLayoutPages.some(page => pathname === page || pathname.startsWith(page + '/'))
  }

  const ComponentWithLayout = shouldUseLayout() ? (
    <LayoutShell showSidebar={false}>
      <Component {...pageProps} />
    </LayoutShell>
  ) : (
    <Component {...pageProps} />
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DurmahProvider>
          <>
            {ComponentWithLayout}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
            <DynamicDurmahWidget />
          </>
        </DurmahProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}