// src/pages/dashboard/index.tsx
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/lib/supabase/AuthContext'

export default function DashboardIndex() {
  const router = useRouter()
  const { user } = useAuth() // Only need user to ensure client-side rendering

  useEffect(() => {
    // Redirect immediately to /year-at-a-glance
    router.replace('/year-at-a-glance')
  }, [router])

  // Optionally, show a loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Redirecting to your calendar...</p>
      </div>
    </div>
  )
}