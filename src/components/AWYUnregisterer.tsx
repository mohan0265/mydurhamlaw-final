'use client'
import { useEffect } from 'react'

export default function AWYUnregisterer() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    
    navigator.serviceWorker.getRegistrations?.()
      .then(regs => regs.forEach(r => {
        const scope = (r as any).scope || ''
        if (scope.includes('awy') || scope.includes('push')) {
          console.log('[AWYUnregisterer] Unregistering service worker:', scope)
          r.unregister()
        }
      }))
      .catch(() => {
        // Silently ignore errors - service worker cleanup is best effort
      })
  }, [])
  
  return null
}