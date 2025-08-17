'use client'

import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { BookOpen, Users, Brain, Trophy } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Logo } from '@/components/ui/Logo'
import { BrandTitle } from '@/components/ui/BrandTitle'
import { getAuthRedirect } from '@/lib/authRedirect'

export default function SignUpPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleGoogleSignUp = async () => {
    setLoading(true)

    try {
      console.log('🔄 Initiating Google Sign-up...')

      const supabase = getSupabaseClient();
      if (!supabase) {
        toast.error('Unable to connect to authentication service');
        setLoading(false);
        return;
      }

      const redirectTo = getAuthRedirect()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          },
          scopes: 'openid email profile'
        }
      })

      if (error) {
        console.error('🚨 Google Sign-up Error:', error)
        toast.error(`Sign-up failed: ${error.message}`)
        setLoading(false)
        return
      }

      console.log('✅ Google Sign-up initiated successfully')
      // Don't set loading to false here as the page will redirect
      
    } catch (err: any) {
      console.error('🚨 Sign-up error:', err)
      toast.error(`Sign-up failed: ${err.message || 'Please try again.'}`)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 z-10">
        <div className="flex items-center justify-between max-w-6xl mx-auto flex-wrap gap-4">
          <Logo variant="dark" size="md" href="/" className="flex-shrink-0" />
          <Link 
            href="/login" 
            className="text-purple-600 hover:text-purple-700 font-medium transition-colors text-sm sm:text-base min-h-[44px] flex items-center px-2 -mx-2 flex-shrink-0"
          >
            <span className="hidden sm:inline">Already have an account? </span>Sign In
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen pt-24 sm:pt-20 pb-8 sm:pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
              Welcome to <BrandTitle variant="light" size="4xl" as="span" />
            </h2>
            <p className="text-base sm:text-xl text-gray-600 mb-6 sm:mb-8 px-2">
              Your AI-powered study companion for MyDurhamLaw students
            </p>
            
            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                  <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">AI Study Assistant</h3>
                <p className="text-sm sm:text-base text-gray-600">Get personalized help with your legal studies and assignments</p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Year-Specific Content</h3>
                <p className="text-sm sm:text-base text-gray-600">Access materials tailored to your specific year of study</p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                  <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Track Progress</h3>
                <p className="text-sm sm:text-base text-gray-600">Monitor your learning journey and academic achievements</p>
              </div>
            </div>
          </div>

          {/* Sign Up Card */}
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
              <div className="text-center mb-6 sm:mb-8">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Get Started</h3>
                <p className="text-sm sm:text-base text-gray-600">Sign up with your Google account to begin your journey</p>
              </div>

              <button
                onClick={handleGoogleSignUp}
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold text-base sm:text-lg flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-xl min-h-[48px] touch-manipulation"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Redirecting to Google...</span>
                  </div>
                ) : (
                  <>
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
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
              </button>

              <div className="mt-6 text-center">
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                  By signing up, you agree to our{' '}
                  <Link href="/legal/terms-of-use" className="text-purple-600 hover:underline min-h-[44px] inline-flex items-center px-1 -mx-1">
                    Terms of Use
                  </Link>
                  {' '}and{' '}
                  <Link href="/legal/privacy-policy" className="text-purple-600 hover:underline min-h-[44px] inline-flex items-center px-1 -mx-1">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}