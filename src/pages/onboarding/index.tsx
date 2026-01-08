// Redirect to the main onboarding page
import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function OnboardingIndex() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/onboarding/calendar')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-500"></div>
    </div>
  )
}