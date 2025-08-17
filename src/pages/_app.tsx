// src/pages/_app.tsx
import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'

import { HydrationBoundary, QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { validateEnv } from '@/lib/env'
// NOTE: AuthContext lives in src/supabase/AuthContext.tsx
import { AuthProvider } from '@/lib/supabase/AuthContext'

import { DurmahProvider } from '@/context/DurmahContext'
import LayoutShell from '@/layout/LayoutShell'
import { Toaster } from 'react-hot-toast'

// Server-only RSS boot (no-op in browser)
if (typeof window === 'undefined') {
  import('@/lib/rss/init')
    .then(({ initializeRSSSystem }) => {
      setTimeout(() => initializeRSSSystem(), 3000)
    })
    .catch((error) => {
      console.error('Failed to import RSS initialization:', error)
    })
}

// Durmah Voice widget: client-side only
const DynamicDurmahWidget = dynamic(
  () => import('@/components/voice/DurmahWidget').then((mod) => ({ default: mod.DurmahWidget })),
  { ssr: false }
)

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()

  // One QueryClient for the lifespan of the app
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
    const handleRouteChange = () => window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
    handleRouteChange()
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => router.events.off('routeChangeComplete', handleRouteChange)
  }, [router.events])

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <HydrationBoundary state={(pageProps as any)?.dehydratedState}>
            <DurmahProvider>
              <LayoutShell>
                <Component {...pageProps} />
              </LayoutShell>

              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: { background: '#363636', color: '#fff' },
                  success: { duration: 3000, iconTheme: { primary: '#10b981', secondary: '#fff' } },
                  error: { duration: 5000, iconTheme: { primary: '#ef4444', secondary: '#fff' } },
                }}
              />

              <DynamicDurmahWidget />
            </DurmahProvider>
          </HydrationBoundary>
        </QueryClientProvider>
      </AuthProvider>
    </>
  )
}
