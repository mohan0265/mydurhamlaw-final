// import VoiceChatPage from './wellbeing/VoiceChatPage' // Removed - using new voice system
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function Wellbeing() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to main wellbeing page since voice chat is now integrated
    router.replace('/wellbeing/main')
  }, [router])
  
  return <div>Redirecting to wellbeing...</div>
}
