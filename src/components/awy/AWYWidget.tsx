'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Heart, Video, X, Loader2, Lock, ArrowRight, User } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { AuthContext } from '@/lib/supabase/AuthContext'

interface Connection {
  id: string // loved_one_id or student_id
  displayName: string
  isAvailable: boolean
  status: string
  role?: 'student' | 'loved_one'
}

export default function AWYWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [connections, setConnections] = useState<Connection[]>([])
  const [isMyAvailabilityOn, setIsMyAvailabilityOn] = useState(false)
  const [userRole, setUserRole] = useState<'student' | 'loved_one' | null>(null)
  const [presencePausedUntil, setPresencePausedUntil] = useState<number | null>(null)
  const [presenceError, setPresenceError] = useState<string | null>(null)
  
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
        .select('user_id,is_available,status')
        .in('user_id', ids)
      if (error) throw error
      return new Map((data || []).map((row: any) => [row.user_id, row]))
    }

    const loadStudentView = async () => {
      const { data, error } = await contextSupabase
        .from('awy_connections')
        .select('loved_one_id,nickname,relationship,status')
        .eq('student_id', userId)
        .eq('status', 'active')
      if (error) throw error

      const lovedOneIds = (data || [])
        .map((conn: any) => conn.loved_one_id)
        .filter((id: string | null): id is string => Boolean(id))

      const presenceMap = await buildPresenceMap(lovedOneIds)

      const list: Connection[] = (data || [])
        .map((conn: any) => {
          if (!conn.loved_one_id) return null
          const presence = presenceMap.get(conn.loved_one_id)
          return {
            id: conn.loved_one_id,
            displayName: conn.nickname || conn.relationship || 'Loved One',
            isAvailable: Boolean(presence?.is_available),
            status: presence?.status || 'offline',
            role: 'loved_one'
          }
        })
        .filter(Boolean) as Connection[]

      setConnections(list)
    }

    const loadLovedOneView = async () => {
      const { data, error } = await contextSupabase
        .from('awy_connections')
        .select('student_id,student:profiles!student_id(display_name)')
        .eq('loved_one_id', userId)
        .eq('status', 'active')
      if (error) throw error

      const studentIds = (data || [])
        .map((conn: any) => conn.student_id)
        .filter((id: string | null): id is string => Boolean(id))

      const presenceMap = await buildPresenceMap(studentIds)

      const list: Connection[] = (data || [])
        .map((conn: any) => {
          if (!conn.student_id) return null
          const presence = presenceMap.get(conn.student_id)
          return {
            id: conn.student_id,
            displayName: conn.student?.display_name || 'Student',
            isAvailable: Boolean(presence?.is_available),
            status: presence?.status || 'offline',
            role: 'student'
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

  useEffect(() => {
    if (!authLoading) {
      fetchData()
    }
  }, [authLoading, fetchData])

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
    }, 15000)

    return () => {
      if (channelRef.current) {
        contextSupabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      clearInterval(interval)
    }
  }, [contextSupabase, userId, fetchData])

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
                      {conn.isAvailable && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm animate-pulse"></span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{conn.displayName}</p>
                      <p className={`text-xs font-medium ${conn.isAvailable ? 'text-green-600' : 'text-gray-400'}`}>
                        {conn.isAvailable ? 'Available' : 'Away'}
                      </p>
                    </div>
                  </div>
                  
                  {conn.isAvailable && (
                    <a
                      href={getJitsiUrl(conn.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-pink-100 text-pink-600 rounded-full hover:bg-pink-500 hover:text-white transition-all shadow-sm hover:shadow-md transform hover:scale-105"
                      title="Start Video Call"
                    >
                      <Video className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
