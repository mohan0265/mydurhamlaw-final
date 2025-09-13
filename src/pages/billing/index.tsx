// src/pages/billing/index.tsx
'use client'

import { useEffect, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'

export default function BillingPage() {
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)

  useEffect(() => {
    const supabase = getSupabaseClient()
    supabase?.auth.getUser().then(({ data }) => {
      const u = data?.user
      setUser(u ? { id: u.id, email: u.email ?? '' } : null)
    })
  }, [])

  const startTrial = async () => {
    if (!user) {
      alert('Please sign in first')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.email }),
      })
      const json = await res.json()
      if (json?.url) {
        window.location.href = json.url
      } else {
        alert('Could not start checkout')
      }
    } catch (e: any) {
      alert(`Error: ${e?.message || e}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <button
        onClick={startTrial}
        disabled={loading}
        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg"
      >
        {loading ? 'Redirecting…' : 'Start 30-day free trial'}
      </button>
    </div>
  )
}
