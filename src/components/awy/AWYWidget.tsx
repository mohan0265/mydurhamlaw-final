'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Heart, Video, X, Loader2, Lock, ArrowRight, User, Plus, Send, Trash, Check, Copy, Phone, PhoneOff } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { AuthContext } from '@/lib/supabase/AuthContext'
import { fetchAuthed } from '@/lib/fetchAuthed'
import dynamic from 'next/dynamic'

// Lazy load call modals
const DailyCallModal = dynamic(() => import('./DailyCallModal'), { ssr: false })
const IncomingCallModal = dynamic(() => import('./IncomingCallModal'), { ssr: false })

interface Connection {
  id: string // loved_one_id or student_id
  displayName: string
  isAvailable: boolean
  status: string
  role?: 'student' | 'loved_one'
  email?: string
  lastSeenAt?: string | null
}

export default function AWYWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [connections, setConnections] = useState<Connection[]>([])
  const [isMyAvailabilityOn, setIsMyAvailabilityOn] = useState(false)
  const [userRole, setUserRole] = useState<'student' | 'loved_one' | null>(null)
  const [presencePausedUntil, setPresencePausedUntil] = useState<number | null>(null)
  const [presenceError, setPresenceError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRelationship, setInviteRelationship] = useState('Parent')
  const [inviteSending, setInviteSending] = useState(false)
  const [pendingInvites, setPendingInvites] = useState<Connection[]>([])
  const [availabilityLockUntil, setAvailabilityLockUntil] = useState<number | null>(null)
  const [editingEmail, setEditingEmail] = useState<string | null>(null)
  
  const [inviteSuccessLink, setInviteSuccessLink] = useState<string | null>(null)
  const [inviteSuccessMessage, setInviteSuccessMessage] = useState<string | null>(null)
  const [inviteCopied, setInviteCopied] = useState(false)
  
  // Daily.co Call State
  const [activeCall, setActiveCall] = useState<{ callId: string; roomUrl: string; callerName: string } | null>(null)
  const [isCallingId, setIsCallingId] = useState<string | null>(null) // ID of connection being called
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'connected' | 'declined'>('idle')
  const [incomingCall, setIncomingCall] = useState<{ callId: string; roomUrl: string; callerName: string } | null>(null)
  const callChannelRef = useRef<any>(null)
  const incomingChannelRef = useRef<any>(null)
  
  // Use global auth context instead of creating new client
  const { user, supabase: contextSupabase, loading: authLoading } = React.useContext(AuthContext)
  const userId = user?.id || null
  
  const channelRef = useRef<any>(null)
  const schemaErrorLoggedRef = useRef(false)

  const deriveUserRole = useCallback((): 'student' | 'loved_one' => {
    const appMeta = user?.app_metadata as Record<string, unknown> | undefined;
    const metadataRole =
      (user?.user_metadata?.role as 'student' | 'loved_one' | undefined) ||
      (user?.user_metadata?.user_role as 'student' | 'loved_one' | undefined) ||
      (appMeta?.role as 'student' | 'loved_one' | undefined) ||
      (appMeta?.user_role as 'student' | 'loved_one' | undefined);
    return metadataRole === 'loved_one' ? 'loved_one' : 'student';
  }, [user]);

  // Fetch initial data without hitting Next.js proxies (prevents 401 spam)
  const fetchData = useCallback(async () => {
    const now = Date.now()
    if (presencePausedUntil && now < presencePausedUntil) {
      return
    }

    if (!contextSupabase || !userId) {
      if (!authLoading) {
        setConnections([])
        setLoading(false)
      }
      return
    }

    const buildPresenceMap = async (ids: string[]) => {
      if (!ids.length) return new Map<string, any>()
      const { data, error } = await contextSupabase
        .from('awy_presence')
        .select('user_id,is_available,status,last_seen_at,last_seen')
        .in('user_id', ids)
      if (error) throw error
      return new Map((data || []).map((row: any) => [row.user_id, row]))
    }

    const loadStudentView = async () => {
      const { data, error } = await contextSupabase
        .from('awy_connections')
        .select('id,student_id,loved_one_id,nickname,relationship,relationship_label,status,loved_email,email,invite_token,invited_at,accepted_at')
        .eq('student_id', userId)
        .in('status', ['active','accepted','pending','invited','granted','revoked'])
      if (error) throw error

      const activeStatuses = ['active', 'accepted', 'granted']

      // Get IDs of loved ones who have registered (for presence lookup)
      const registeredLovedIds = (data || [])
        .filter((conn: any) => activeStatuses.includes((conn.status || '').toLowerCase()) && conn.loved_one_id)
        .map((conn: any) => conn.loved_one_id)

      const presenceMap = await buildPresenceMap(registeredLovedIds)

      // Show ALL active connections, even if loved_one_id is null (they haven't registered yet)
      const activeList: Connection[] = (data || [])
        .filter((conn: any) => activeStatuses.includes((conn.status || '').toLowerCase()))
        .map((conn: any) => {
          const lovedId = conn.loved_one_id
          const presence = lovedId ? presenceMap.get(lovedId) : null
          const status = (conn.status || '').toLowerCase()
          
          // If loved_one_id is null, they haven't registered - show as "Awaiting signup"
          const isRegistered = Boolean(lovedId)
          
          return {
            id: lovedId || conn.id,  // Use connection id as fallback for non-registered
            displayName: conn.nickname || conn.relationship || conn.relationship_label || 'Loved One',
            isAvailable: isRegistered ? Boolean(presence?.is_available) : false,
            status: isRegistered 
              ? (presence?.status || (status === 'accepted' || status === 'active' || status === 'granted' ? 'offline' : 'offline'))
              : 'Awaiting signup',
            role: 'loved_one' as const,
            email: conn.loved_email || conn.email,
            lastSeenAt: presence?.last_seen_at || presence?.last_seen || null
          }
        })

      const pendingList: Connection[] = (data || [])
        .filter((conn: any) => !activeStatuses.includes((conn.status || '').toLowerCase()))
        .map((conn: any) => ({
          id: conn.id,
          displayName: conn.nickname || conn.relationship || conn.relationship_label || 'Loved One',
          isAvailable: false,
          status: conn.status,
          role: 'loved_one' as const,
          email: conn.loved_email || conn.email
        }))

      setConnections(activeList)
      setPendingInvites(pendingList)
    }

    const loadLovedOneView = async () => {
      // Get user's email for fallback matching
      const userEmail = user?.email?.toLowerCase() || ''
      
      // 1. Get connections - match by loved_one_id, loved_user_id, OR loved_email
      // This ensures newly-authorized loved ones can see their students even before their ID is linked
      const { data, error } = await contextSupabase
        .from('awy_connections')
        .select('student_id,status,loved_one_id,loved_email')
        .or(`loved_one_id.eq.${userId},loved_user_id.eq.${userId}${userEmail ? `,loved_email.ilike.${userEmail}` : ''}`)
        .in('status', ['active','accepted','granted'])
      if (error) throw error

      if (!data || data.length === 0) {
        setConnections([])
        return
      }

      const studentIds = data
        .map((conn: any) => conn.student_id)
        .filter((id: string | null): id is string => Boolean(id))

      // 2. Get names
      const { data: profiles } = await contextSupabase
        .from('profiles')
        .select('id,display_name')
        .in('id', studentIds)
      
      const nameMap = new Map((profiles || []).map((p: any) => [p.id, p.display_name]))

      // 3. Get presence
      const presenceMap = await buildPresenceMap(studentIds)

      const list: Connection[] = data
        .map((conn: any) => {
          const studentId = conn.student_id
          if (!studentId) return null
          const presence = presenceMap.get(studentId)
          const name = nameMap.get(studentId) || 'Student'
          
          return {
            id: studentId,
            displayName: name,
            isAvailable: Boolean(presence?.is_available),
            status: presence?.status || 'offline',
            role: 'student',
            lastSeenAt: presence?.last_seen_at || presence?.last_seen || null
          }
        })
        .filter(Boolean) as Connection[]

      setConnections(list)
    }

    try {
      // First check metadata
      let role = deriveUserRole()
      
      // If metadata says student, double-check by querying profile and connections
      if (role === 'student' && userId && user?.email) {
        try {
          // Check profile's user_role
          const { data: profile } = await contextSupabase
            .from('profiles')
            .select('user_role')
            .eq('id', userId)
            .maybeSingle()
          
          if (profile?.user_role === 'loved_one') {
            role = 'loved_one'
          } else {
            // Also check if this email is in awy_connections as a loved one
            const { data: conn } = await contextSupabase
              .from('awy_connections')
              .select('id')
              .ilike('loved_email', user.email)
              .in('status', ['active', 'accepted', 'granted'])
              .limit(1)
              .maybeSingle()
            
            if (conn) {
              role = 'loved_one'
            }
          }
        } catch (roleCheckErr) {
          console.warn('[AWY] Role check fallback skipped:', roleCheckErr)
        }
      }
      
      setUserRole(role)

      const { data: myPresence, error: presenceError } = await contextSupabase
        .from('awy_presence')
        .select('is_available')
        .eq('user_id', userId)
        .maybeSingle()
      if (presenceError && presenceError.code !== 'PGRST116') throw presenceError

      // If no presence row yet, create one so toggles persist
      if (!myPresence) {
        try {
          await contextSupabase
            .from('awy_presence')
            .upsert({ user_id: userId, is_available: false }, { onConflict: 'user_id' })
        } catch (insertErr) {
          console.warn('[AWY] presence bootstrap skipped:', (insertErr as any)?.message || insertErr)
        }
      }

      if (!availabilityLockUntil || Date.now() > availabilityLockUntil) {
        setIsMyAvailabilityOn(Boolean(myPresence?.is_available))
      }
      setPresenceError(null)

      if (role === 'loved_one') {
        await loadLovedOneView()
      } else {
        await loadStudentView()
      }
    } catch (err) {
      console.error('AWY fetch error:', err)
      const message = (err as any)?.message || ''
      const code = (err as any)?.code || ''
      if (!schemaErrorLoggedRef.current && (code === '42703' || message.includes('is_available'))) {
        schemaErrorLoggedRef.current = true
        console.error('[AWY] presence schema mismatch detected; pausing polling.')
      }
      if (code === '42703' || message.includes('is_available')) {
        setPresencePausedUntil(Date.now() + 60000) // 60s cooldown
        setPresenceError('Presence temporarily unavailable. Retrying shortly.')
      } else {
        setPresenceError('Presence currently unavailable.')
      }
      setConnections([])
    } finally {
      setLoading(false)
    }
  }, [authLoading, contextSupabase, deriveUserRole, presencePausedUntil, userId])

  const sendHeartbeat = useCallback(async (availability?: boolean | null) => {
    if (!contextSupabase || !userId) return
    const now = Date.now()
    if (presencePausedUntil && now < presencePausedUntil) return
    try {
      await contextSupabase.rpc('awy_heartbeat', {
        p_is_available: availability === undefined ? null : availability
      })
    } catch (err: any) {
      const message = err?.message || ''
      if (!schemaErrorLoggedRef.current && message.includes('awy_heartbeat')) {
        schemaErrorLoggedRef.current = true
        console.error('[AWY] heartbeat missing; pausing polling.')
      }
      setPresencePausedUntil(Date.now() + 60000)
      setPresenceError('Presence temporarily unavailable. Retrying shortly.')
    }
  }, [contextSupabase, presencePausedUntil, userId])

  useEffect(() => {
    if (!authLoading) {
      fetchData()
      sendHeartbeat(null)
    }
  }, [authLoading, fetchData, sendHeartbeat])

  useEffect(() => {
    if (!contextSupabase || !userId) return

    if (channelRef.current) {
      contextSupabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = contextSupabase
      .channel('awy_presence_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'awy_presence'
        },
        (payload: any) => {
          setConnections(prev =>
            prev.map(connection => {
              if (connection.id === payload.new.user_id) {
                return {
                  ...connection,
                  isAvailable: payload.new.is_available,
                  status: payload.new.status || 'online'
                }
              }
              return connection
            })
          )
        }
      )
      .subscribe()

    channelRef.current = channel

    const interval = setInterval(() => {
      fetchData()
      sendHeartbeat(null)
    }, 30000)

    return () => {
      if (channelRef.current) {
        contextSupabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      clearInterval(interval)
    }
  }, [contextSupabase, userId, fetchData, sendHeartbeat])

  // Listen for incoming calls (students receiving calls from loved ones)
  useEffect(() => {
    if (!contextSupabase || !userId || userRole !== 'student') return
    
    const channel = contextSupabase
      .channel('student-incoming-calls')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'awy_calls',
          filter: `student_id=eq.${userId}`
        },
        (payload: any) => {
          // Only show if we're not the caller and call is ringing
          if (payload.new.status === 'ringing' && payload.new.caller_id !== userId) {
            const caller = connections.find(c => c.id === payload.new.loved_one_id)
            setIncomingCall({
              callId: payload.new.id,
              roomUrl: payload.new.room_url,
              callerName: caller?.displayName || 'Your Loved One'
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'awy_calls',
          filter: `student_id=eq.${userId}`
        },
        (payload: any) => {
          if (['ended', 'missed', 'declined'].includes(payload.new.status)) {
            if (incomingCall?.callId === payload.new.id) {
              setIncomingCall(null)
            }
            if (activeCall?.callId === payload.new.id) {
              setActiveCall(null)
              toast.success('Call ended')
            }
          }
        }
      )
      .subscribe()
    
    incomingChannelRef.current = channel
    
    return () => {
      if (incomingChannelRef.current) {
        contextSupabase.removeChannel(incomingChannelRef.current)
        incomingChannelRef.current = null
      }
    }
  }, [contextSupabase, userId, userRole, connections, incomingCall, activeCall])

  const toggleAvailability = async () => {
    if (!contextSupabase || !userId) {
      toast.error('Sign in to update your availability')
      return
    }

    const previous = isMyAvailabilityOn
    const newState = !previous
    setIsMyAvailabilityOn(newState)

    try {
      const { error } = await contextSupabase.rpc('awy_heartbeat', {
        p_is_available: newState
      })
      if (error) throw error
      sendHeartbeat(newState)
      setAvailabilityLockUntil(Date.now() + 15000) // keep UI stable for 15s
      setTimeout(() => setAvailabilityLockUntil(null), 15000)
      fetchData()
      toast.success(newState ? "You are now visible" : "You are hidden")
    } catch (err) {
      console.error('AWY availability update failed:', err)
      setIsMyAvailabilityOn(previous)
      toast.error('Failed to update status')
    }
  }

  // === DAILY.CO VIDEO CALL ===
  const startCall = async (lovedOneId: string, lovedOneName: string) => {
    if (!userId || isCallingId) return
    
    setIsCallingId(lovedOneId)
    setCallStatus('calling')
    
    try {
      const res = await fetch('/api/awy/call/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ lovedOneId })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to start call')
      }
      
      const { callId, roomUrl } = data
      
      // Subscribe to call status updates
      if (contextSupabase) {
        const channel = contextSupabase
          .channel(`call-${callId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'awy_calls',
              filter: `id=eq.${callId}`
            },
            (payload: any) => {
              const status = payload.new.status
              if (status === 'accepted') {
                setCallStatus('connected')
                setActiveCall({ callId, roomUrl, callerName: lovedOneName })
                toast.success(`${lovedOneName} accepted your call!`)
              } else if (status === 'declined') {
                setCallStatus('declined')
                toast.error(`${lovedOneName} declined the call`)
                setTimeout(() => {
                  setCallStatus('idle')
                  setIsCallingId(null)
                }, 2000)
              } else if (status === 'ended' || status === 'missed') {
                setCallStatus('idle')
                setIsCallingId(null)
                setActiveCall(null)
              }
            }
          )
          .subscribe()
        
        callChannelRef.current = channel
      }
      
      toast.success(`Calling ${lovedOneName}...`)
      
      // Auto-timeout after 30s if no response
      setTimeout(() => {
        if (callStatus === 'calling') {
          endCall(callId)
          toast.error('Call timed out - no answer')
        }
      }, 30000)
      
    } catch (err: any) {
      console.error('[AWY] Start call error:', err)
      toast.error(err.message || 'Failed to start call')
      setCallStatus('idle')
      setIsCallingId(null)
    }
  }
  
  const endCall = async (callId?: string) => {
    const id = callId || activeCall?.callId
    if (!id) return
    
    try {
      await fetch('/api/awy/call/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ callId: id })
      })
    } catch (err) {
      console.error('[AWY] End call error:', err)
    }
    
    // Cleanup
    if (callChannelRef.current && contextSupabase) {
      contextSupabase.removeChannel(callChannelRef.current)
      callChannelRef.current = null
    }
    setActiveCall(null)
    setCallStatus('idle')
    setIsCallingId(null)
  }

  // Handle accepting incoming call (for students)
  const handleAcceptCall = async () => {
    if (!incomingCall) return
    
    try {
      const res = await fetch('/api/awy/call/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ callId: incomingCall.callId, action: 'accept' })
      })
      
      if (res.ok) {
        setActiveCall({
          callId: incomingCall.callId,
          roomUrl: incomingCall.roomUrl,
          callerName: incomingCall.callerName
        })
        setIncomingCall(null)
        toast.success('Call connected!')
      } else {
        toast.error('Failed to accept call')
      }
    } catch (err) {
      console.error('[AWY] Accept call error:', err)
      toast.error('Failed to accept call')
    }
  }

  const handleDeclineCall = async () => {
    if (!incomingCall) return
    
    try {
      await fetch('/api/awy/call/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ callId: incomingCall.callId, action: 'decline' })
      })
    } catch (err) {
      console.error('[AWY] Decline call error:', err)
    }
    
    setIncomingCall(null)
    toast.success('Call declined')
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Email is required')
      return
    }
    setInviteSending(true)
    setInviteSuccessLink(null)
    setInviteSuccessMessage(null)
    setInviteCopied(false)

    try {
      const res = await fetchAuthed('/api/awy/add-loved-one', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          relationship: inviteRelationship || 'Loved one',
          nickname: inviteRelationship || null
        })
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to send invite')
      }

      setInviteSuccessMessage(editingEmail ? `Updated details for ${inviteEmail}.` : `Access authorized for ${inviteEmail}.`)
      setInviteSuccessLink(`${window.location.origin}/loved-one-login`) // Use login page link
      toast.success(editingEmail ? 'Details updated' : 'Access granted!')
      
      fetchData()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send invite')
    } finally {
      setInviteSending(false)
    }
  }

  const closeAndReset = () => {
    setShowAddModal(false)
    setInviteEmail('')
    setInviteRelationship('Parent')
    setEditingEmail(null)
    setInviteSuccessLink(null)
    setInviteSuccessMessage(null)
    setInviteCopied(false)
  }

  const copyToClipboard = async () => {
    if (inviteSuccessLink) {
      try {
        await navigator.clipboard.writeText(inviteSuccessLink)
        setInviteCopied(true)
        toast.success('Link copied!')
        setTimeout(() => setInviteCopied(false), 2000)
      } catch (err) {
        toast.error('Failed to copy')
      }
    }
  }

  const handleResend = async (conn: Connection) => {
    setInviteEmail(conn.email || '')
    setInviteRelationship(conn.displayName || 'Loved one')
    setEditingEmail(conn.email || null)
    setShowAddModal(true)
  }

  const handleRevoke = async (conn: Connection) => {
    if (!contextSupabase) return
    if (!confirm(`Are you sure you want to revoke access for ${conn.displayName}?`)) return
    
    try {
      const res = await fetchAuthed('/api/awy/revoke-loved-one', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId: conn.id })
      })
      
      if (!res.ok) throw new Error('Failed to revoke')
      
      toast.success('Access revoked')
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Could not revoke access')
    }
  }

  // Audit Log State
  const [showAudit, setShowAudit] = useState(false)
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [auditLoading, setAuditLoading] = useState(false)

  const openAuditLog = async (connId: string) => {
    setShowAudit(true)
    setAuditLoading(true)
    setAuditLogs([])
    try {
      const { data, error } = await contextSupabase
        .from('awy_audit_log')
        .select('*')
        .eq('connection_id', connId)
        .order('created_at', { ascending: false })
        .limit(20)
      
      if (error) throw error
      setAuditLogs(data || [])
    } catch (err) {
      toast.error('Failed to load logs')
    } finally {
      setAuditLoading(false)
    }
  }

  const isOnline = (conn: Connection) => {
    if (!conn.lastSeenAt) return false
    const last = new Date(conn.lastSeenAt).getTime()
    return Date.now() - last < 90_000
  }

  if (loading) return null

  // Logged Out Modal / Prompt
  if (isOpen && !userId) {
    return (
      <div className="fixed bottom-24 right-6 z-[65] flex w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-pink-100 bg-white shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300">
         <div className="bg-gradient-to-r from-pink-500 to-rose-500 px-5 py-4 flex items-center justify-between text-white">
            <h3 className="font-bold text-lg">Connect with Love</h3>
            <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-white/20">
               <X size={20} />
            </button>
         </div>

         <div className="p-8 text-center flex flex-col items-center">
             <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mb-4">
                <Heart className="w-8 h-8 text-pink-500 fill-pink-500" />
             </div>
             <p className="text-gray-600 mb-8 leading-relaxed">
               Log in or start a free trial to use the ‘Always With You’ widget and see when your loved ones are online – even from thousands of miles away.
             </p>
             <div className="flex flex-col gap-3 w-full">
               <Link href="/login" className="w-full py-3 bg-pink-500 text-white rounded-xl font-bold hover:bg-pink-600 transition-colors flex items-center justify-center gap-2">
                 Log In
               </Link>
               <Link href="/signup" className="w-full py-3 bg-white text-pink-500 border border-pink-200 rounded-xl font-bold hover:bg-pink-50 transition-colors">
                 Start Free Trial
               </Link>
             </div>
         </div>
      </div>
    );
  }

  // 1. Closed Launcher (Pill Style)
  const hasOnlineLovedOnes = connections.some(c => c.isAvailable)
  
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-[55] flex flex-col items-end group">
        {/* Tooltip */}
        <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 w-max opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none translate-x-2 group-hover:translate-x-0">
          <div className="bg-gray-900/90 backdrop-blur-sm text-white text-xs py-2.5 px-4 rounded-xl shadow-xl border border-white/10">
            <div className="font-bold mb-0.5 text-pink-200">Always With You</div>
            <div className="text-gray-300">
              {hasOnlineLovedOnes 
                ? '💚 Your loved one is online!' 
                : 'See when your loved ones are online.'}
            </div>
          </div>
          {/* Arrow */}
          <div className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-3 bg-gray-900/90 rotate-45 border-t border-r border-white/10"></div>
        </div>

        {/* Pulsing glow ring when loved ones are online */}
        {hasOnlineLovedOnes && (
          <div className="absolute inset-0 rounded-full bg-green-400/30 animate-ping pointer-events-none" style={{ animationDuration: '2s' }}></div>
        )}

        <button
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-3 pl-2 pr-5 py-2 rounded-full shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 ${
            hasOnlineLovedOnes 
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 ring-4 ring-green-300/50 animate-pulse' 
              : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:ring-2 hover:ring-pink-400/50'
          } text-white`}
        >
          {/* Icon Circle */}
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-inner relative">
             <Heart className="w-5 h-5 fill-white text-white" />
             {/* Online Indicator Badge if anyone is online */}
             {hasOnlineLovedOnes && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-green-400 border-2 border-current rounded-full animate-pulse"></span>
             )}
          </div>
          
          <div className="flex flex-col items-start">
             <span className="font-bold text-sm leading-tight">Always With You</span>
             <span className="text-[10px] text-current/80 font-medium">
               {hasOnlineLovedOnes ? 'Someone is online!' : 'Connect with Loved Ones'}
             </span>
          </div>
        </button>
      </div>
    )
  }

  // 2. Open Widget (Logged In)
  return (
    <>
    <div className="fixed bottom-24 right-6 z-[65] flex flex-col items-end space-y-4 group">
      <div className="bg-white rounded-3xl shadow-2xl border border-pink-100 w-80 animate-in slide-in-from-bottom-5 fade-in duration-300 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 px-5 py-4 flex items-center justify-between text-white">
           <div>
             <h3 className="font-bold text-lg flex items-center gap-2">
               Always With You
             </h3>
             <p className="text-xs text-pink-100 font-medium">Emotional Connection</p>
           </div>
           <button 
             onClick={() => setIsOpen(false)}
             className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
           >
             <X className="w-5 h-5" />
           </button>
        </div>

        <div className="p-5">
          {/* My Status Toggle - ONLY for students */}
          {userRole === 'student' ? (
            <div className="flex items-center justify-between bg-pink-50/50 p-4 rounded-2xl mb-5 border border-pink-100">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-800">I&apos;m Available</span>
                <span className="text-xs text-gray-500">Let them know you&apos;re free</span>
              </div>
              <button
                onClick={toggleAvailability}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 ${
                  isMyAvailabilityOn ? 'bg-pink-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                    isMyAvailabilityOn ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ) : (
            /* For loved ones - show connected status (no toggle needed) */
            <div className="flex items-center gap-3 bg-green-50 p-4 rounded-2xl mb-5 border border-green-100">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-green-600 fill-green-600" />
              </div>
              <div>
                <span className="text-sm font-semibold text-green-800">You&apos;re Connected</span>
                <p className="text-xs text-green-600">Your student can see you&apos;re online</p>
              </div>
            </div>
          )}

          {presenceError && (
            <div className="mb-4 text-xs text-orange-700 bg-orange-50 border border-orange-100 rounded-2xl px-3 py-2">
              {presenceError}
            </div>
          )}

          {/* Add Loved One button - only for students */}
          {userRole === 'student' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full mb-4 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-pink-200 text-pink-600 bg-white hover:bg-pink-50 transition-all text-sm font-semibold"
            >
              <Plus className="w-4 h-4" /> Add Loved One
            </button>
          )}

          {/* Connections List */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Connections</div>
            {connections.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                No active connections yet.
              </div>
            ) : (
              connections.map(conn => (
                <div key={conn.id} className="flex flex-col p-3 hover:bg-gray-50 rounded-2xl transition-all border border-transparent hover:border-gray-100 group">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center text-pink-600 font-bold text-lg shadow-sm">
                          {conn.displayName.charAt(0)}
                        </div>
                        {(conn.isAvailable || isOnline(conn)) && (
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm animate-pulse"></span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{conn.displayName}</p>
                        <p className={`text-xs font-medium ${conn.isAvailable ? 'text-green-600' : 'text-gray-400'}`}>
                          {conn.status === 'revoked' ? 'Revoked' : 
                           conn.isAvailable ? 'Available' : 
                           isOnline(conn) ? 'Online recently' : 'Away'}
                        </p>
                        {conn.lastSeenAt && (
                           <p className="text-[10px] text-gray-400">Last seen: {new Date(conn.lastSeenAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                       {conn.status !== 'revoked' && (
                         <button
                           onClick={() => startCall(conn.id, conn.displayName)}
                           disabled={!conn.isAvailable || isCallingId === conn.id}
                           className={`p-2 rounded-full transition-all shadow-sm ${conn.isAvailable && !isCallingId ? 'bg-pink-100 text-pink-600 hover:bg-pink-500 hover:text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'} ${isCallingId === conn.id ? 'animate-pulse bg-green-100 text-green-600' : ''}`}
                           title={isCallingId === conn.id ? 'Calling...' : conn.isAvailable ? "Start Video Call" : "Available when online"}
                         >
                           {isCallingId === conn.id ? <Phone className="w-4 h-4 animate-bounce" /> : <Video className="w-4 h-4" />}
                         </button>
                       )}
                       {/* Activity Log */}
                       <button
                         onClick={() => openAuditLog(conn.id)}
                         className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-all font-mono text-[10px]"
                         title="Activity Log"
                       >
                         LOG
                       </button> 
                       {/* Revoke for Active Users */}
                       {conn.status !== 'revoked' && (
                         <button
                           onClick={() => handleRevoke(conn)}
                           className="p-2 bg-gray-100 text-red-500 rounded-full hover:bg-red-50 transition-all"
                           title="Revoke Access"
                         >
                           <Trash className="w-4 h-4" />
                         </button>
                       )}
                    </div>
                  </div>
                </div>
              ))
            )}

            {pendingInvites.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending / Revoked</div>
                {pendingInvites.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{inv.displayName}</p>
                      <p className="text-xs text-gray-500">{inv.email}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${inv.status === 'revoked' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {inv.status}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openAuditLog(inv.id)}
                        className="p-2 rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-gray-100"
                         title="Log"
                      >
                         LOG
                      </button>
                      {inv.status !== 'revoked' && (
                        <button
                          onClick={() => handleResend(inv)}
                          className="p-2 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                          title="Edit / Resend"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* For pending, delete is fine? Or revoke? Revoke is better for audit. */}
                      {inv.status !== 'revoked' && (
                        <button
                          onClick={() => handleRevoke(inv)}
                          className="p-2 rounded-full bg-white border border-gray-200 text-red-600 hover:bg-red-50"
                          title="Revoke"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {showAddModal && (
      <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900">
              {inviteSuccessLink ? 'Access Granted' : 'Add Loved One'}
            </h3>
            <button onClick={closeAndReset} className="p-2 rounded-full hover:bg-slate-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          {inviteSuccessLink ? (
             <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
               <div className="bg-green-50 text-green-800 p-4 rounded-xl text-sm font-medium flex gap-3 items-start">
                  <Check className="w-5 h-5 mt-0.5 shrink-0" />
                  <div>
                    <p>They can now log in immediately!</p>
                    <p className="text-green-700/80 mt-1 text-xs font-normal">
                      Share the login link below with them. They can sign in using their Google account ({inviteEmail}).
                    </p>
                  </div>
               </div>

               <div className="relative">
                  <input 
                    readOnly 
                    value={inviteSuccessLink} 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-600 text-xs rounded-xl px-3 py-3 font-mono pr-12 focus:outline-none"
                  />
                  <button 
                     onClick={copyToClipboard}
                     className="absolute right-1 top-1 bottom-1 px-3 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-pink-600 hover:border-pink-200 transition-colors flex items-center justify-center"
                     title="Copy Login Link"
                   >
                    {inviteCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
               </div>
               
               <button
                 onClick={closeAndReset}
                 className="w-full py-3 rounded-xl font-bold bg-pink-500 text-white hover:bg-pink-600 transition-colors shadow-lg shadow-pink-200"
               >
                 Done
               </button>
             </div>
          ) : (
             <>
               <div className="space-y-3">
                 <div>
                   <label className="text-xs font-semibold text-slate-600">Email</label>
                   <input
                     type="email"
                     value={inviteEmail}
                     onChange={(e) => setInviteEmail(e.target.value)}
                     className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/40"
                     placeholder="parent@example.com"
                   />
                 </div>
                 <div>
                   <label className="text-xs font-semibold text-slate-600">Relationship</label>
                   <input
                     value={inviteRelationship}
                     onChange={(e) => setInviteRelationship(e.target.value)}
                     className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/40"
                     placeholder="Mum, Dad, Guardian"
                   />
                 </div>
               </div>
               <div className="flex justify-end gap-2">
                 <button
                   onClick={closeAndReset}
                   className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100"
                 >
                   Cancel
                 </button>
                 <button
                   onClick={handleInvite}
                   disabled={inviteSending}
                   className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-pink-500 hover:bg-pink-600 disabled:opacity-70 inline-flex items-center gap-2"
                 >
                   {inviteSending && <Loader2 className="w-4 h-4 animate-spin" />}
                   Grant Access
                 </button>
               </div>
             </>
          )}
        </div>
      </div>
    )}
    
    {/* Audit Log Modal */}
    {showAudit && (
      <div className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[80vh] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-900">Activity Log</h3>
            <button onClick={() => setShowAudit(false)} className="p-2 rounded-full hover:bg-slate-100">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3">
            {auditLoading ? (
               <div className="flex justify-center py-8"><Loader2 className="animate-spin text-pink-500" /></div>
            ) : auditLogs.length === 0 ? (
               <p className="text-gray-400 text-center py-8 text-sm">No activity recorded for this connection.</p>
            ) : (
               auditLogs.map(log => (
                 <div key={log.id} className="text-xs border-b border-slate-100 pb-2 mb-2 last:border-0">
                    <div className="flex justify-between mb-1">
                      <span className="font-bold text-slate-700 uppercase">{log.action}</span>
                      <span className="text-slate-400">{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                    <div className="text-slate-500">
                      {log.actor_role === 'student' ? 'By You' : 'By Loved One'}
                       {log.details && Object.keys(log.details).length > 0 && (
                         <span className="block mt-1 font-mono bg-slate-50 p-1 rounded text-[10px] break-all">
                           {JSON.stringify(log.details)}
                         </span>
                       )}
                    </div>
                 </div>
               ))
            )}
          </div>
        </div>
      </div>
    )}
    
    {/* Incoming Call Modal (for students receiving calls) */}
    {incomingCall && (
      <IncomingCallModal
        callId={incomingCall.callId}
        callerName={incomingCall.callerName}
        onAccept={handleAcceptCall}
        onDecline={handleDeclineCall}
      />
    )}
    
    {/* Active Video Call Modal */}
    {activeCall && (
      <DailyCallModal
        roomUrl={activeCall.roomUrl}
        callId={activeCall.callId}
        callerName={activeCall.callerName}
        onHangup={() => endCall()}
      />
    )}
    </>
  )
}
