'use client'

import { useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { storeSignupMetadata, type SignupMetadata } from '@/lib/utils/metadata-storage'
import { getAuthRedirect } from '@/lib/authRedirect'

interface GoogleSignInButtonProps {
  agree: boolean
  displayName: string
  yearGroup: 'foundation' | 'year1' | 'year2' | 'year3'
}

const GoogleSignInButton = ({ agree, displayName, yearGroup }: GoogleSignInButtonProps) => {
  const [loading, setLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    if (!agree) {
      toast.error('You must agree to the terms and policies before continuing.')
      return
    }

    if (!displayName || displayName.trim().length === 0) {
      toast.error('Please enter your display name before continuing.')
      return
    }

    if (!yearGroup) {
      toast.error('Please select your year group before continuing.')
      return
    }

    setLoading(true)

    try {
      // ✅ Store signup metadata in localStorage AND sessionStorage for redundancy
      const signupMetadata: SignupMetadata = {
        display_name: displayName.trim(),
        year_group: yearGroup,
        user_type: yearGroup,
        agreed_to_terms: true
      }

      // Store in both localStorage and sessionStorage for better persistence
      storeSignupMetadata(signupMetadata)
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('durham_signup_metadata', JSON.stringify(signupMetadata))
          // Also store in a more persistent way with timestamp
          const persistentData = {
            ...signupMetadata,
            timestamp: Date.now(),
            browser_id: `${navigator.userAgent.slice(0, 50)}_${Date.now()}`
          }
          localStorage.setItem('durham_signup_backup', JSON.stringify(persistentData))
        } catch (e) {
          console.warn('Failed to store signup metadata in sessionStorage')
        }
      }

      console.log('✅ Signup metadata stored before OAuth:', signupMetadata)

      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      // ✅ Create OAuth redirect URL with metadata encoded
      const baseRedirectUrl = getAuthRedirect()
      const metadataParam = encodeURIComponent(JSON.stringify({
        yg: yearGroup,
        dn: displayName.trim(),
        at: true,
        src: 'signup'
      }))
      const redirectUrl = `${baseRedirectUrl}?signup_data=${metadataParam}`

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          },
          scopes: 'openid email profile'
        }
      })

      if (error) {
        console.error('🚨 Google OAuth Error:', error)
        toast.error(`Google sign-in failed: ${error.message}`)
        setLoading(false)
        return
      }

      console.log('✅ Google OAuth initiated successfully for year group:', yearGroup)
      // Don't set loading to false here as the page will redirect
      
    } catch (err: any) {
      console.error('🚨 Sign-in error:', err)
      toast.error(`Sign-in failed: ${err.message || 'Please try again.'}`)
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleGoogleSignIn}
      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium text-lg flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      disabled={loading || !agree || !displayName.trim() || !yearGroup}
    >
      {loading ? (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Redirecting to Google...</span>
        </div>
      ) : (
        <>
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>Continue with Google</span>
        </>
      )}
    </Button>
  )
}

export default GoogleSignInButton