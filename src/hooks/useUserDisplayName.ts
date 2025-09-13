import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'

export const useUserDisplayName = () => {
  const [displayName, setDisplayName] = useState<string>('')

  useEffect(() => {
    const getDisplayName = async () => {
      try {
        const supabase = getSupabaseClient();
        if (!supabase) {
          setDisplayName('Student');
          return;
        }

        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user

        if (!user) {
          setDisplayName('')
          return
        }

        // Try to get display name from user profile first
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single()

        if (userProfile?.display_name) {
          setDisplayName(userProfile.display_name)
        } else if (user?.user_metadata?.display_name) {
          setDisplayName(user.user_metadata.display_name)
        } else {
          // Fallback to email username or 'Student'
          const emailName = user.email?.split('@')[0] || 'Student'
          setDisplayName(emailName)
        }
      } catch (error) {
        console.error('Error getting display name:', error)
        setDisplayName('Student')
      }
    }

    getDisplayName()
  }, [])

  return { displayName }
}