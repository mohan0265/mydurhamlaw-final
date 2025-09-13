'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { getSupabaseClient, debugAuthState, handleOAuthSession } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState('Processing authentication...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 OAuth callback initiated with URL:', window.location.href)
        setStatus('Exchanging authorization code...')

        // ✅ CRITICAL FIX: Properly handle the OAuth callback with URL parameters
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        const error_code = urlParams.get('error')
        const error_description = urlParams.get('error_description')
        const signup_data = urlParams.get('signup_data')
        
        // 🚀 Parse signup metadata from URL if available
        let urlMetadata = null
        if (signup_data) {
          try {
            const parsed = JSON.parse(decodeURIComponent(signup_data))
            urlMetadata = {
              year_group: parsed.yg,
              display_name: parsed.dn,
              agreed_to_terms: parsed.at,
              user_type: parsed.yg,
              signup_source: parsed.src
            }
            console.log('✅ Parsed signup metadata from URL:', urlMetadata)
          } catch (e) {
            console.warn('Failed to parse signup_data from URL:', e)
          }
        }

        // Check for OAuth errors first
        if (error_code) {
          console.error('🚨 OAuth error from provider:', { error_code, error_description })
          setError(`OAuth error: ${error_description || error_code}`)
          setStatus('Authentication failed. Redirecting to login...')
          setTimeout(() => router.push('/login?error=oauth_provider_error'), 3000)
          return
        }

        if (!code) {
          console.error('🚨 No authorization code found in callback URL')
          setError('No authorization code received')
          setStatus('Authentication failed. Redirecting to login...')
          setTimeout(() => router.push('/login?error=no_auth_code'), 3000)
          return
        }

        console.log('✅ Authorization code found, letting Supabase handle session...')

        // ✅ With createBrowserClient and detectSessionInUrl: true, 
        // Supabase automatically handles the OAuth callback
        // We just need to wait for the session to be established
        
        setStatus('Establishing session...')
        
        // Wait for Supabase to process the OAuth callback
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Get the session that should now be established
        const supabase = getSupabaseClient()
        if (!supabase) {
          console.error('🚨 Supabase client not available');
          setError('Authentication service unavailable');
          setStatus('Authentication failed. Redirecting to login...');
          setTimeout(() => router.push('/login?error=client_unavailable'), 3000);
          return;
        }
        
        const { data: { session }, error: getSessionError } = await supabase.auth.getSession()
        
        if (getSessionError || !session) {
          console.error('🚨 Session not established after OAuth:', getSessionError)
          setError('Session creation failed')
          setStatus('Authentication failed. Redirecting to login...')
          setTimeout(() => router.push('/login?error=session_not_established'), 3000)
          return
        }

        console.log('✅ OAuth session established:', session.user.id)
        console.log('Session details:', {
          userId: session.user.id,
          email: session.user.email,
          expiresAt: session.expires_at,
          accessToken: session.access_token ? 'present' : 'missing',
          refreshToken: session.refresh_token ? 'present' : 'missing'
        })
        
        // 🚀 Store parsed metadata in sessionStorage for LoginRedirectPage
        if (urlMetadata && typeof window !== 'undefined') {
          try {
            sessionStorage.setItem('oauth_signup_metadata', JSON.stringify(urlMetadata))
            console.log('✅ Stored OAuth metadata for LoginRedirectPage')
          } catch (e) {
            console.warn('Failed to store OAuth metadata in sessionStorage')
          }
        }
        setStatus('Authentication successful! Verifying session...')

        // Wait a moment for session to be fully established
        await new Promise(resolve => setTimeout(resolve, 1000))

        // ✅ Verify the session is properly established
        const { session: verifiedSession, error: verifyError } = await debugAuthState()

        if (verifyError || !verifiedSession?.user) {
          console.error('🚨 Session verification failed:', verifyError)
          setError('Session verification failed')
          setStatus('Session verification failed. Redirecting to login...')
          setTimeout(() => router.push('/login?error=session_verification_failed'), 3000)
          return
        }

        console.log('✅ Session verified successfully, redirecting to LoginRedirectPage')
        setStatus('Redirecting to complete setup...')
        
        // Redirect to LoginRedirectPage for profile creation/verification
        router.push('/LoginRedirectPage')

      } catch (error: any) {
        console.error('🚨 OAuth callback error:', error)
        setError(`Unexpected error: ${error.message}`)
        setStatus('Authentication failed. Redirecting to login...')
        setTimeout(() => router.push('/login?error=unexpected_error'), 3000)
      }
    }

    // Only run if we have URL parameters (indicating OAuth callback)
    if (typeof window !== 'undefined' && (window.location.search || window.location.hash)) {
      handleAuthCallback()
    } else {
      console.log('❌ No OAuth parameters found, redirecting to login')
      router.push('/login')
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-50">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="mb-6">
          {error ? (
            <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          ) : (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          )}
        </div>
        
        <h1 className="text-2xl font-bold text-purple-700 mb-4">
          {error ? 'Authentication Failed' : 'Authenticating...'}
        </h1>
        <p className="text-lg text-gray-700 mb-4">{status}</p>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 mb-3">{error}</p>
            <div className="space-y-2">
              <button
                onClick={() => router.push('/login')}
                className="block w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Return to Login
              </button>
              <button
                onClick={() => router.push('/signup')}
                className="block w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
              >
                Try Sign Up
              </button>
            </div>
          </div>
        )}
        
        {/* Debug info for development */}
        {process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs text-gray-600">Debug URL: {window.location.href}</p>
            <p className="text-xs text-gray-600">Has search params: {!!window.location.search}</p>
            <p className="text-xs text-gray-600">Has hash: {!!window.location.hash}</p>
          </div>
        )}
      </div>
    </div>
  )
}