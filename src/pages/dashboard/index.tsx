// src/pages/dashboard/index.tsx
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/lib/supabase/AuthContext'
import YearSelectionPrompt from '@/components/academic/YearSelectionPrompt'

const DEBUG =
  process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_DEBUG === 'true'

type YearGroup = 'foundation' | 'year1' | 'year2' | 'year3'
type Profile = {
  user_id: string
  year_group: YearGroup | null
  display_name: string | null
  created_at: string
  updated_at: string
}

const isYearGroup = (val: string): val is YearGroup =>
  val === 'foundation' || val === 'year1' || val === 'year2' || val === 'year3'

const yearToRoute = (year: YearGroup) => `/dashboard/${year}`

export default function DashboardIndex() {
  const router = useRouter()
  const { user, userType, getDashboardRoute } = useAuth()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [showYearSelection, setShowYearSelection] = useState(false)
  const [isEnsuring, setIsEnsuring] = useState(false)
  const ensureOnce = useRef(false)

  const ensureProfile = useCallback(async () => {
    if (!user || isEnsuring || ensureOnce.current) return
    ensureOnce.current = true
    setIsEnsuring(true)

    try {
      if (DEBUG) console.debug('👤 Ensuring profile for user', user.id)
      const res = await fetch('/api/profile/ensure', { method: 'POST' })
      if (res.ok) {
        const text = await res.text()
        const data = text.trim() ? JSON.parse(text) : null
        if (data && data.profile) {
          setProfile(data.profile)
          if (DEBUG) console.debug('✅ Profile ensured', data.profile)
        } else {
          console.warn('⚠️ Empty or invalid profile response')
        }
      } else {
        console.error('🚨 Failed to ensure profile', res.status)
      }
    } catch (e) {
      console.error('🚨 Error ensuring profile', e)
    } finally {
      setIsEnsuring(false)
    }
  }, [user, isEnsuring])

  useEffect(() => {
    if (user) ensureProfile()
  }, [user, ensureProfile])

  useEffect(() => {
    if (!user) return
    const effectiveYear: YearGroup | null =
      (profile?.year_group as YearGroup | null) ?? (userType as YearGroup | null) ?? null

    if (!effectiveYear) {
      if (DEBUG) console.debug('🎯 No year set → show selector')
      setShowYearSelection(true)
      return
    }

    const custom = getDashboardRoute?.()
    const target = custom && custom !== '/dashboard' ? custom : yearToRoute(effectiveYear)
    if (DEBUG) console.debug('➡️ Redirecting to', target)
    router.replace(target)
  }, [user, userType, profile, getDashboardRoute, router])

  // Accept string to match YearSelectionPrompt’s prop type
  const handleYearSelected = useCallback((year: string): void => {
    if (!isYearGroup(year)) {
      console.warn('Invalid year selected:', year)
      return
    }
    ;(async () => {
      try {
        const res = await fetch('/api/profile/update-year', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ year_group: year }),
        })
        if (!res.ok) {
          console.error('🚨 Failed to update year', res.status)
          return
        }
        const text = await res.text()
        const data = text.trim() ? JSON.parse(text) : null
        if (data && data.profile) {
          if (DEBUG) console.debug('✅ Year updated', data.profile)
          setProfile(data.profile)
          setShowYearSelection(false)
          router.replace(yearToRoute(year))
        } else {
          console.warn('⚠️ Empty or invalid year update response')
        }
      } catch (e) {
        console.error('🚨 Error updating year', e)
      }
    })()
  }, [router])

  useEffect(() => {
    ensureOnce.current = false
  }, [user?.id])

  if (showYearSelection && user) {
    return <YearSelectionPrompt userId={user.id} onYearSelected={handleYearSelected} />
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">
          {isEnsuring ? 'Setting up your profile…' : 'Redirecting to your dashboard…'}
        </p>
      </div>
    </div>
  )
}
