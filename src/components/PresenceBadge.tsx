'use client'
import { useContext } from 'react'
import { AuthContext } from '@/lib/supabase/AuthContext'

export default function PresenceBadge() {
  const { user } = useContext(AuthContext) || {}
  const online = !!user
  return (
    <span
      title={online ? 'Online' : 'Offline'}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 8px', borderRadius: 999, fontSize: 12,
        background: online ? 'rgba(34,197,94,.12)' : 'rgba(107,114,128,.12)',
        color: online ? '#059669' : '#4b5563',
      }}
    >
      <span style={{
        width: 8, height: 8, borderRadius: 999,
        background: online ? '#10b981' : '#9ca3af'
      }} />
      {online ? 'Online' : 'Offline'}
    </span>
  )
}
