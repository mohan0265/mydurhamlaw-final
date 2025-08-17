import { useState, useEffect, useContext, useCallback, useRef } from 'react'
import { useRouter } from 'next/router'
import { AuthContext } from '@/lib/supabase/AuthContext'
import YearSelectionPrompt from '@/components/academic/YearSelectionPrompt'
import GlobalLayout from '@/components/layout/GlobalLayout'

const DEBUG = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_DEBUG === 'true'

interface Profile {
  user_id: string
  year_group: string | null
  display_name: string | null
  created_at: string
  updated_at: string
}

export default function DashboardRedirect() {
  const router = useRouter()
  const { user, userType, getDashboardRoute } = useContext(AuthContext)
  const [showYearSelection, setShowYearSelection] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isEnsuring, setIsEnsuring] = useState(false)
  const ensureCalledRef = useRef(false)

  // Ensure profile exists on mount (once per user session)
  const ensureProfile = useCallback(async () => {
    if (!user || isEnsuring || ensureCalledRef.current) return
    
    ensureCalledRef.current = true
    setIsEnsuring(true)
    
    try {
      if (DEBUG) console.debug('👤 Dashboard: Ensuring profile exists for user', user.id)
      
      const response = await fetch('/api/profile/ensure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (DEBUG) console.debug('✅ Dashboard: Profile ensured', data)
        setProfile(data.profile)
      } else {
        // Log error but don't block UI - AuthContext will handle fallback
        console.error('🚨 Dashboard: Failed to ensure profile', response.status)
      }
    } catch (error) {
      console.error('🚨 Dashboard: Error ensuring profile', error)
    } finally {
      setIsEnsuring(false)
    }
  }, [user, isEnsuring])

  // Call ensure profile when user is available
  useEffect(() => {
    if (user) {
      ensureProfile()
    }
  }, [user, ensureProfile])

  // Handle dashboard routing logic
  useEffect(() => {
    const handleRouting = () => {
      if (!user) {
        // No user, stay in loading state
        return
      }

      // Use profile data if available, fallback to userType from AuthContext
      const yearGroup = profile?.year_group || userType
      
      if (!yearGroup) {
        // No year group set, show selection modal
        if (DEBUG) console.debug('🎯 Dashboard: No year group, showing selection modal')
        setShowYearSelection(true)
      } else {
        // Year group exists, redirect to dashboard
        if (DEBUG) console.debug('🎯 Dashboard: Year group found, redirecting', yearGroup)
        const dashboardRoute = getDashboardRoute?.() || '/dashboard'
        router.push(dashboardRoute)
      }
    }

    // Small delay to avoid flash and let profile load
    const timeoutId = setTimeout(handleRouting, 100)
    return () => clearTimeout(timeoutId)
  }, [user, userType, profile, getDashboardRoute, router])

  // Handle year selection completion
  const handleYearSelected = useCallback(async (year: string) => {
    if (DEBUG) console.debug('🎯 Dashboard: Year selected', year)
    
    try {
      const response = await fetch('/api/profile/update-year', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ year_group: year })
      })

      if (response.ok) {
        const data = await response.json()
        if (DEBUG) console.debug('✅ Dashboard: Year updated', data)
        
        // Update local profile state
        setProfile(data.profile)
        setShowYearSelection(false)
        
        // Refresh page to update AuthContext with new profile
        window.location.reload()
      } else {
        console.error('🚨 Dashboard: Failed to update year', response.status)
        // Keep modal open, let user try again
      }
    } catch (error) {
      console.error('🚨 Dashboard: Error updating year', error)
      // Keep modal open, let user try again
    }
  }, [])

  // Reset ensure flag when user changes
  useEffect(() => {
    ensureCalledRef.current = false
  }, [user?.id])

  // Show year selection modal if needed
  if (showYearSelection && user) {
    return (
      <GlobalLayout>
        <YearSelectionPrompt
          onYearSelected={handleYearSelected}
          userId={user.id}
        />
      </GlobalLayout>
    )
  }

  // Show loading state while determining route
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">
          {isEnsuring ? 'Setting up your profile...' : 'Redirecting to your dashboard...'}
        </p>
      </div>
    </div>
  )
}