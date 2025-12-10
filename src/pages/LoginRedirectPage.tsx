'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { getSupabaseClient } from '@/lib/supabase/client'
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
        const supabaseClient = getSupabaseClient();
        if (!supabaseClient) throw new Error("Supabase client not available");
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession()

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
        console.log('👤 User email:', user.email)
        setDebugInfo(`User ID: ${user.id}, Email: ${user.email}`)
        
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

        // ✅ Determine user role (student or loved_one)
        let userRole = 'student' // default
        
        // Check if user is marked as loved_one in metadata
        if (user.user_metadata?.role === 'loved_one') {
          userRole = 'loved_one'
          console.log('🔍 User role from metadata: loved_one')
        } else {
          // Check if user exists in awy_connections as a loved one
          const { data: connectionData } = await supabase
            .from('awy_connections')
            .select('loved_one_id, relationship, display_name')
            .eq('loved_email', user.email?.toLowerCase())
            .maybeSingle()

          if (connectionData && connectionData.loved_one_id === user.id) {
            userRole = 'loved_one'
            console.log('🔍 User role from awy_connections: loved_one')
          }
        }

        console.log(`✅ Final user role determined: ${userRole}`)
        setDebugInfo(`User role: ${userRole}`)

        // ✅ Check if profile already exists (created by trigger or previous signup)
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id, user_role, year_group, display_name, agreed_to_terms')
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
          // Existing user - update role if needed and redirect
          const profileRole = existingProfile.user_role || userRole
          const displayName = existingProfile.display_name || user.email?.split('@')[0] || 'User'
          
          // Update role if it's different
          if (existingProfile.user_role !== userRole) {
            console.log(`🔄 Updating user role from ${existingProfile.user_role} to ${userRole}`)
            await supabase
              .from('profiles')
              .update({ user_role: userRole, updated_at: new Date().toISOString() })
              .eq('id', user.id)
          }

          console.log('✅ Existing profile found:', { role: userRole, displayName })
          
          if (userRole === 'loved_one') {
            setStatus(`Welcome back, ${displayName}! Redirecting to your family dashboard...`)
            setTimeout(() => {
              console.log('🚀 Redirecting loved one to family dashboard')
              router.push('/loved-one/dashboard')
            }, 1500)
          } else {
            // Student user
            const yearGroup = existingProfile.year_group
            setStatus(`Welcome back, ${displayName}! Redirecting to your ${yearGroup} dashboard...`)
            
            const dashboardRoute = getDashboardRoute(yearGroup)
            setTimeout(() => {
              console.log('🚀 Redirecting student to:', dashboardRoute)
              router.push(dashboardRoute)
            }, 1500)
          }
        } else {
          // New user - create profile and redirect appropriately
          console.log(`🆕 New ${userRole} detected, creating profile...`)
          
          // ✅ FIXED: Create profile data with proper typing
          const baseProfileData: any = {
            id: user.id,
            user_role: userRole,
            display_name: user.email?.split('@')[0] || 'User',
            agreed_to_terms: userRole === 'loved_one' ? true : false, // Loved ones auto-agree
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          // Add year_group for students only
          if (userRole === 'student') {
            baseProfileData.year_group = null // Will be set in complete-profile
          }

          const { error: createError } = await supabase
            .from('profiles')
            .insert([baseProfileData])

          if (createError) {
            console.error('🚨 Profile creation error:', createError)
            setDebugInfo(`Profile creation error: ${createError.message}`)
            setStatus('Profile creation failed. Please try again.')
            setShowFallback(true)
            return
          }

          if (userRole === 'loved_one') {
            // Loved ones go directly to dashboard
            setStatus(`Welcome! Redirecting to your family dashboard...`)
            setTimeout(() => {
              console.log('🚀 Redirecting new loved one to family dashboard')
              router.push('/loved-one/dashboard')
            }, 1500)
          } else {
            // Students need to complete profile
            setStatus('Welcome! Let\'s complete your profile...')
            setTimeout(() => {
              console.log('🚀 Redirecting new student to profile completion')
              router.push('/complete-profile')
            }, 1500)
          }
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
                onClick={() => router.push('/loved-one/dashboard')}
                className="block w-full bg-violet-600 text-white px-4 py-2 rounded-md hover:bg-violet-700 transition-colors"
              >
                Family Dashboard
              </button>
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
                onClick={() => router.push('/')}
                className="block w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
