// client redirect to /community
import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function CommunityRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/community')
  }, [router])
  return null
}