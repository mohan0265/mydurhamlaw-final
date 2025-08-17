'use client'

import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { AuthContext } from '@/lib/supabase/AuthContext'

const API_BASE = (process.env.NEXT_PUBLIC_AWY_API_BASE || '/api').replace(/\/$/, '')

async function ensureProfile(user: { id: string; email?: string | null }) {
  await fetch(`${API_BASE}/profile/ensure`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': user.id,
      ...(user.email ? { 'x-user-email': user.email } : {}),
    },
  }).catch(() => {})
}

async function registerPush(userId: string) {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    const registration = await navigator.serviceWorker.register('/sw.js')
    const vapidPublic = process.env.NEXT_PUBLIC_AWY_PUBLIC_VAPID_KEY
    if (!vapidPublic) return

    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublic),
    })

    await fetch(`${API_BASE}/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify({ subscription: sub }),
    })
  } catch (e) {
    console.warn('[AWY] push registration failed', e)
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) output[i] = rawData.charCodeAt(i)
  return output
}

export function AWYBootstrap() {
  const { user } = useContext(AuthContext) || {}
  const [open, setOpen] = useState(false)
  const started = useRef(false)

  // de-dupe in case both routers mount this
  useEffect(() => {
    if (typeof window === 'undefined') return
    if ((window as any).__AWY_MOUNTED__) {
      setOpen(false)
      started.current = true
    } else {
      ;(window as any).__AWY_MOUNTED__ = true
    }
  }, [])

  useEffect(() => {
    if (started.current) return
    started.current = true
    if (!user) return // logged out: skip network calls

    const u = { id: (user as any).id as string, email: (user as any).email as string | undefined }
    ensureProfile(u)
    registerPush(u.id)
  }, [user])

  const button = useMemo(
    () => (
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open AWY"
        style={{
          position: 'fixed',
          right: 16,
          bottom: 16,
          zIndex: 50,
          width: 56,
          height: 56,
          borderRadius: 999,
          boxShadow: '0 8px 24px rgba(0,0,0,.2)',
          background: 'linear-gradient(135deg, #a855f7, #ec4899)',
          color: 'white',
          fontWeight: 700,
          border: 'none',
          cursor: 'pointer',
        }}
      >
        AWY
      </button>
    ),
    []
  )

  const panel = open ? (
    <div
      style={{
        position: 'fixed',
        right: 16,
        bottom: 88,
        zIndex: 50,
        width: 320,
        maxWidth: '90vw',
        maxHeight: '60vh',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 16px 48px rgba(0,0,0,.25)',
        background: 'white',
        border: '1px solid #eee',
      }}
    >
      <div style={{ padding: 12, borderBottom: '1px solid #eee', fontWeight: 700 }}>Always With You</div>
      <div style={{ padding: 12, fontSize: 14 }}>
        {user ? (
          <>
            <p>You are online. Start a quick call or DM a classmate.</p>
            <p style={{ opacity: 0.7, fontSize: 12 }}>
              Signaling endpoint ready at <code>/api/awy/signaling</code>.
            </p>
          </>
        ) : (
          <p>Please sign in to use calls and messages.</p>
        )}
      </div>
    </div>
  ) : null

  return (
    <>
      {panel}
      {button}
    </>
  )
}

export default AWYBootstrap