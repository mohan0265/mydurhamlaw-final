'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Heart, Video, X, Loader2, Lock, ArrowRight, User, Plus, Send, Trash, Check, Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { AuthContext } from '@/lib/supabase/AuthContext'
import { fetchAuthed } from '@/lib/fetchAuthed'

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
  
  const [inviteSuccessLink, setInviteSuccessLink] = useState<string | null>(null)
  const [inviteSuccessMessage, setInviteSuccessMessage] = useState<string | null>(null)
  const [inviteCopied, setInviteCopied] = useState(false)
  
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
        .in('status', ['active','accepted','pending','invited'])
      if (error) throw error

      const activeStatuses = ['active', 'accepted']

      const activeIds = (data || [])
        .filter((conn: any) => activeStatuses.includes((conn.status || '').toLowerCase()))
        .map((conn: any) => conn.loved_one_id)
        .filter((id: string | null): id is string => Boolean(id))

      const presenceMap = await buildPresenceMap(activeIds)

      const activeList: Connection[] = (data || [])
        .filter((conn: any) => activeStatuses.includes((conn.status || '').toLowerCase()))
        .map((conn: any) => {
          const lovedId = conn.loved_one_id
          if (!lovedId) return null
          const presence = presenceMap.get(lovedId)
          const status = (conn.status || '').toLowerCase()
          return {
            id: lovedId,
            displayName: conn.nickname || conn.relationship || conn.relationship_label || 'Loved One',
            isAvailable: Boolean(presence?.is_available),
            status: presence?.status || (status === 'accepted' || status === 'active' ? 'online' : 'offline'),
            role: 'loved_one',
            email: conn.loved_email || conn.email,
            lastSeenAt: presence?.last_seen_at || presence?.last_seen || null
          }
        })
        .filter(Boolean) as Connection[]

      const pendingList: Connection[] = (data || [])
        .filter((conn: any) => !activeStatuses.includes((conn.status || '').toLowerCase()))
        .map((conn: any) => ({
          id: conn.id,
          displayName: conn.nickname || conn.relationship || conn.relationship_label || 'Loved One',
          isAvailable: false,
          status: conn.status,
          role: 'loved_one',
          email: conn.loved_email || conn.email
        }))

      setConnections(activeList)
      setPendingInvites(pendingList)
    }

    const loadLovedOneView = async () => {
      const { data, error } = await contextSupabase
        .from('awy_connections')
        .select('student_id,student:profiles!student_id(display_name),status')
        .eq('loved_one_id', userId)
        .in('status', ['active','accepted'])
      if (error) throw error

      const studentIds = (data || [])
        .map((conn: any) => conn.student_id)
        .filter((id: string | null): id is string => Boolean(id))

      const presenceMap = await buildPresenceMap(studentIds)

      const list: Connection[] = (data || [])
        .map((conn: any) => {
          const studentId = conn.student_id || conn.student_user_id
          if (!studentId) return null
          const presence = presenceMap.get(studentId)
          return {
            id: studentId,
            displayName: conn.student?.display_name || 'Student',
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
      const role = deriveUserRole()
      setUserRole(role)

      const { data: myPresence, error: presenceError } = await contextSupabase
        .from('awy_presence')
        .select('is_available')
        .eq('user_id', userId)
        .maybeSingle()
      if (presenceError && presenceError.code !== 'PGRST116') throw presenceError
      setIsMyAvailabilityOn(Boolean(myPresence?.is_available))
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
      toast.success(newState ? "You are now visible" : "You are hidden")
    } catch (err) {
      console.error('AWY availability update failed:', err)
      setIsMyAvailabilityOn(previous)
      toast.error('Failed to update status')
    }
  }

  const getJitsiUrl = (otherId: string) => {
    if (!userId) return '#'
    // Consistent room name: MyDurhamLaw-{studentId}-{lovedOneId}
    
    const studentId = userRole === 'student' ? userId : otherId
    const lovedOneId = userRole === 'student' ? otherId : userId
    
    return `https://meet.jit.si/MyDurhamLaw-${studentId}-${lovedOneId}`
  }

  const openCall = (otherId: string) => {
    const url = getJitsiUrl(otherId)
    window.open(url, '_blank', 'noopener,noreferrer')
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

      if (true) { // Always success path now, backend returns { ok: true, message: ... }
        setInviteSuccessMessage(`Access authorized for ${inviteEmail}.`)
        setInviteSuccessLink(`${window.location.origin}/loved-one-login`) // Use login page link
        toast.success('Access granted!')
      }
      
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
    setShowAddModal(true)
  }

  const handleRevoke = async (conn: Connection) => {
    if (!contextSupabase) return
    try {
      const { error } = await contextSupabase.from('awy_connections').delete().eq('id', conn.id)
      if (error) throw error
      toast.success('Invite removed')
      fetchData()
    } catch (err) {
      toast.error('Could not remove invite')
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
      <div className="fixed bottom-24 right-6 z-50 flex w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-pink-100 bg-white shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300">
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
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end group">
        {/* Tooltip */}
        <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 w-max opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none translate-x-2 group-hover:translate-x-0">
          <div className="bg-gray-900/90 backdrop-blur-sm text-white text-xs py-2.5 px-4 rounded-xl shadow-xl border border-white/10">
            <div className="font-bold mb-0.5 text-pink-200">Always With You</div>
            <div className="text-gray-300">See when your loved ones are online.</div>
          </div>
          {/* Arrow */}
          <div className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-3 bg-gray-900/90 rotate-45 border-t border-r border-white/10"></div>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-3 pl-2 pr-5 py-2 rounded-full shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:ring-2 hover:ring-pink-400/50 bg-gradient-to-r from-pink-500 to-rose-500 text-white"
        >
          {/* Icon Circle */}
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-inner relative">
             <Heart className="w-5 h-5 fill-white text-white" />
             {/* Online Indicator Badge if anyone is online */}
             {connections.some(c => c.isAvailable) && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-green-400 border-2 border-pink-500 rounded-full animate-pulse"></span>
             )}
          </div>
          
          <div className="flex flex-col items-start">
             <span className="font-bold text-sm leading-tight">Always With You</span>
             <span className="text-[10px] text-pink-100 font-medium">Connect with Loved Ones</span>
          </div>
        </button>
      </div>
    )
  }

  // 2. Open Widget (Logged In)
  return (
    <>
    <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end space-y-4 group">
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
          {/* My Status Toggle */}
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

          {presenceError && (
            <div className="mb-4 text-xs text-orange-700 bg-orange-50 border border-orange-100 rounded-2xl px-3 py-2">
              {presenceError}
            </div>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="w-full mb-4 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-pink-200 text-pink-600 bg-white hover:bg-pink-50 transition-all text-sm font-semibold"
          >
            <Plus className="w-4 h-4" /> Add Loved One
          </button>

          {/* Connections List */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Connections</div>
            {connections.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                No active connections yet.
              </div>
            ) : (
              connections.map(conn => (
                <div key={conn.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl transition-all border border-transparent hover:border-gray-100 group">
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
                        {conn.isAvailable ? 'Available' : isOnline(conn) ? 'Online recently' : 'Away'}
                      </p>
                    </div>
                  </div>
                  
                  {conn.isAvailable && (
                    <button
                      onClick={() => openCall(conn.id)}
                      className="p-2.5 bg-pink-100 text-pink-600 rounded-full hover:bg-pink-500 hover:text-white transition-all shadow-sm hover:shadow-md transform hover:scale-105"
                      title="Start Video Call"
                    >
                      <Video className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}

            {pendingInvites.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending Invites</div>
                {pendingInvites.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{inv.displayName}</p>
                      <p className="text-xs text-gray-500">{inv.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResend(inv)}
                        className="p-2 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                        title="Resend"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRevoke(inv)}
                        className="p-2 rounded-full bg-white border border-gray-200 text-red-600 hover:bg-red-50"
                        title="Remove"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
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
    </>
  )
}
