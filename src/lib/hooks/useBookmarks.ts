import { useEffect, useState } from 'react'
import { getSupabaseClient } from '../supabase/client'

interface Bookmark {
  id: string
  place_id: string
  category: string
  user_id: string
  created_at: string
}

export function useBookmarks() {
  const [userId, setUserId] = useState<string | null>(null)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const getUserId = async () => {
      const supabase = getSupabaseClient()
      if (!supabase) {
        setUserId(null)
        return
      }
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)
    }

    getUserId()
  }, [])

  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!userId) {
        setLoading(false)
        return
      }

      const supabase = getSupabaseClient()
      if (!supabase) {
        setError('Database connection unavailable')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('bookmarks')
          .select('*')
          .eq('user_id', userId)

        if (error) throw error
        setBookmarks(data || [])
        setError(null)
      } catch (err: any) {
        setError(err.message)
        setBookmarks([])
      } finally {
        setLoading(false)
      }
    }

    fetchBookmarks()
  }, [userId])

  return { data: bookmarks, loading, error }
}

export function useAddBookmark() {
  const [loading, setLoading] = useState(false)

  const addBookmark = async (bookmark: { place_id: string; category: string }) => {
    setLoading(true)
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error('Database connection unavailable')
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not logged in')

      const { data, error } = await supabase
        .from('bookmarks')
        .insert([{ ...bookmark, user_id: user.id }])

      if (error) throw error
      return data
    } finally {
      setLoading(false)
    }
  }

  return { mutate: addBookmark, loading }
}