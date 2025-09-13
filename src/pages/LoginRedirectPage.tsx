'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { getSupabaseClient, debugAuthState } from '@/lib/supabase/client'
import { getDashboardRoute } from '@/lib/utils/metadata-storage'

export default function LoginRedirectPage() {
  const router = useRouter()
  const [status, setStatus] = useState('Verifying your account...')
  const [showFallback, setShowFallback] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>('')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setStatus('Processing authentication...')
        
        // ✅ Enhanced session verification with debugging
        const { session, error: sessionError } = await debugAuthState()

        if (sessionError) {
          console.error('🚨 Session error:', sessionError)
          setDebugInfo(`Session error: ${(sessionError as any)?.message || 'Unknown session error'}`)
          setStatus('Authentication failed. Redirecting to signup...')
          setTimeout(() => router.push('/signup?error=session_error'), 3000)
          return
        }

        if (!session?.user) {
          console.log('❌ No session found, redirecting to signup')
          setDebugInfo('No active session found')
          setStatus('No session found. Redirecting to signup...')
          setTimeout(() => router.push('/signup?error=no_session'), 3000)
          return
        }

        const user = session.user
        console.log('👤 User authenticated:', user.id)
        console.log('👤 User metadata:', user.user_metadata)
        setDebugInfo(`User ID: ${user.id}`)
        
        setStatus('Setting up your profile...')

        // ✅ Wait a moment for any database triggers to complete
        await new Promise(resolve => setTimeout(resolve, 1500))

        const supabase = getSupabaseClient()
        if (!supabase) {
          console.error('🚨 Supabase client not available')
          setDebugInfo('Database connection not available')
          setStatus('Database connection failed. Please try again.')
          setShowFallback(true)
          return
        }

        // ✅ Check if profile already exists (created by trigger or previous signup)
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id, year_group, display_name, agreed_to_terms')
          .eq('id', user.id)
          .maybeSingle()

        if (profileError) {
          console.error('🚨 Profile lookup error:', profileError)
          setDebugInfo(`Profile lookup error: ${profileError.message}`)
          setStatus('Profile lookup failed. Please try again.')
          setShowFallback(true)
          return
        }

        if (existingProfile) {
          // Existing user - redirect to their dashboard
          const yearGroup = existingProfile.year_group
          const displayName = existingProfile.display_name || user.email?.split('@')[0] || 'User'
          console.log('✅ Existing profile found:', { yearGroup, displayName })
          setStatus(`Welcome back, ${displayName}! Redirecting to your ${yearGroup} dashboard...`)
          
          const dashboardRoute = getDashboardRoute(yearGroup)
          setTimeout(() => {
            console.log('🚀 Redirecting to:', dashboardRoute)
            router.push(dashboardRoute)
          }, 1500)
        } else {
          // New user - redirect to profile completion page
          console.log('🆕 New user detected, redirecting to profile completion')
          setStatus('Welcome! Let\'s complete your profile...')
          
          setTimeout(() => {
            console.log('🚀 Redirecting to profile completion page')
            router.push('/complete-profile')
          }, 1500)
        }

      } catch (error: any) {
        console.error('🚨 Auth callback error:', error)
        setDebugInfo(`Unexpected error: ${error.message}`)
        setStatus('Something went wrong. Please try again.')
        setShowFallback(true)
      }
    }

    handleAuthCallback()

    // Show fallback options after 15 seconds
    const fallbackTimer = setTimeout(() => {
      setShowFallback(true)
    }, 15000)

    return () => clearTimeout(fallbackTimer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-50">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="mb-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        </div>
        
        <h1 className="text-2xl font-bold text-purple-700 mb-4">Almost there!</h1>
        <p className="text-lg text-gray-700 mb-4">{status}</p>

        {/* ✅ Debug info for development */}
        {process.env.NODE_ENV === 'development' && debugInfo && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-600">Debug: {debugInfo}</p>
          </div>
        )}

        {showFallback && (
          <div className="mt-8 p-6 bg-white rounded-lg shadow-lg">
            <p className="text-sm text-gray-600 mb-4">Taking longer than expected?</p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/complete-profile')}
                className="block w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
              >
                Complete Profile
              </button>
              <button
                onClick={() => router.push('/signup')}
                className="block w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Start Over
              </button>
              <button
                onClick={() => window.location.reload()}
                className="block w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Retry Authentication
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}