import { useEffect, ComponentType } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase/client'

export function withAuthProtection<T extends Record<string, unknown>>(Component: ComponentType<T>) {
  return function ProtectedComponent(props: T) {
    const router = useRouter()

    useEffect(() => {
      const checkSession = async () => {
        if (!supabase) {
          alert("🚫 Authentication not available. Please try again later.")
          router.push('/signup')
          return
        }
        
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          alert("🚫 Not a member yet? Please sign up to access this feature.")
          router.push('/signup')
        }
      }
      checkSession()
    }, [router])

    return <Component {...props} />
  }
}
