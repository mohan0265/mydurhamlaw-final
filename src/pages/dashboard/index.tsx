import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function DashboardRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/year-at-a-glance') }, [router])
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-600">Redirecting to your dashboard…</p>
    </div>
  )
}
