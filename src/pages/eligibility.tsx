// src/pages/eligibility.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { Shield, AlertCircle, CheckCircle, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EligibilityPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [isEligible, setIsEligible] = useState<boolean | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  const { next, plan, error, email: rejectedEmail } = router.query
  const nextUrl = Array.isArray(next) ? next[0] : next || '/signup'
  const planId = Array.isArray(plan) ? plan[0] : plan
  const errorType = Array.isArray(error) ? error[0] : error
  const emailParam = Array.isArray(rejectedEmail) ? rejectedEmail[0] : rejectedEmail

  useEffect(() => {
    // Handle callback error (non-Durham email)
    if (errorType === 'not_durham') {
      setIsEligible(false)
      setUserEmail(emailParam || null)
      setChecking(false)
      return
    }

    checkExistingSession()
  }, [errorType, emailParam])

  const checkExistingSession = async () => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      setChecking(false)
      return
    }

    const { data } = await supabase.auth.getSession()
    if (data.session?.user) {
      const email = data.session.user.email
      setUserEmail(email || null)
      
      // Check if already Durham email
      if (email?.endsWith('@durham.ac.uk')) {
        setIsEligible(true)
        // Auto-redirect after brief success message
        setTimeout(() => {
          const redirectUrl = planId ? `${nextUrl}?plan=${planId}` : nextUrl
          router.push(redirectUrl)
        }, 1500)
      } else {
        setIsEligible(false)
      }
    }
    setChecking(false)
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error('Authentication service unavailable')
      }

      // Store intent in session
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('eligibility_check', JSON.stringify({
          next: nextUrl,
          plan: planId,
          timestamp: Date.now()
        }))
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?check_eligibility=true`,
          queryParams: {
            hd: 'durham.ac.uk', // Google domain hint
            access_type: 'offline',
            prompt: 'select_account'
          },
          scopes: 'openid email profile'
        }
      })

      if (error) {
        console.error('OAuth Error:', error)
        toast.error(`Sign-in failed: ${error.message}`)
        setLoading(false)
      }
    } catch (err: any) {
      console.error('Sign-in error:', err)
      toast.error(err.message || 'Authentication failed')
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking eligibility...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Eligibility Check - MyDurhamLaw</title>
        <meta name="description" content="Verify your Durham University eligibility for MyDurhamLaw" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-6 z-10">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Logo variant="dark" size="md" href="/" />
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              Already have an account? Sign In
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex items-center justify-center min-h-screen pt-24 pb-12 px-4">
          <div className="max-w-2xl w-full">
            {isEligible === null ? (
              // Initial state - prompt for verification
              <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-10 h-10 text-blue-600" />
                </div>
                
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Verify Durham University Eligibility
                </h1>
                
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  MyDurhamLaw is exclusively for <strong>Durham University Law students</strong>. 
                  Please verify your eligibility with your Durham email address.
                </p>

                <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mb-8 text-left rounded-r-xl">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-2">Email Requirements</h3>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Must end with <code className="bg-white px-2 py-0.5 rounded">@durham.ac.uk</code></li>
                        <li>• Active Durham University student status</li>
                        <li>• Valid Google account linked to Durham email</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-xl font-medium text-lg flex items-center justify-center space-x-3"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Connecting to Google...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span>Verify with Durham Google Account</span>
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 mt-6">
                  By continuing, you agree to our{' '}
                  <Link href="/legal/terms-of-use" className="text-blue-600 hover:underline">Terms</Link>
                  {' '}and{' '}
                  <Link href="/legal/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
                </p>
              </div>
            ) : isEligible ? (
              // Eligible - Success
              <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Eligibility Confirmed!
                </h1>
                
                <p className="text-lg text-gray-600 mb-2">
                  Welcome, Durham Law student!
                </p>
                
                {userEmail && (
                  <p className="text-sm text-gray-500 mb-6">
                    Verified: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{userEmail}</span>
                  </p>
                )}

                <div className="flex items-center justify-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-3 mb-6">
                  <CheckCircle className="w-4 h-4" />
                  <span>Redirecting you to complete signup...</span>
                </div>
              </div>
            ) : (
              // Not Eligible - Rejection
              <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-10 h-10 text-red-600" />
                </div>
                
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Not Eligible
                </h1>
                
                <p className="text-lg text-gray-600 mb-6">
                  MyDurhamLaw is exclusively for Durham University Law students with a valid{' '}
                  <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">@durham.ac.uk</code> email address.
                </p>

                {userEmail && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-red-800">
                      The email <span className="font-mono font-semibold">{userEmail}</span> is not a Durham University email address.
                    </p>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
                  <h3 className="font-semibold text-gray-900 mb-3">Are you a Durham student?</h3>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li>• Make sure you're using your <strong>@durham.ac.uk</strong> email</li>
                    <li>• Sign in with the Google account linked to your Durham email</li>
                    <li>• If you're having issues, contact your IT support</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={() => {
                      setIsEligible(null)
                      setUserEmail(null)
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Try Again
                  </Button>
                  <Button
                    onClick={() => router.push('/')}
                    className="flex-1 bg-gray-600 hover:bg-gray-700"
                  >
                    Return Home
                  </Button>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">
                    Questions about eligibility?
                  </p>
                  <a 
                    href="mailto:support@mydurhamlaw.com" 
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    Contact Support
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
