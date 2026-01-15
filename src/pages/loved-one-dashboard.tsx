'use client'

import React, { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import { Heart, Video, LogOut, User, RefreshCw, Phone, PhoneOff } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { UKTimeDisplay } from '@/components/ui/UKTimeDisplay'
import dynamic from 'next/dynamic'

// Lazy load call modals
const DailyCallModal = dynamic(() => import('@/components/awy/DailyCallModal'), { ssr: false })
const IncomingCallModal = dynamic(() => import('@/components/awy/IncomingCallModal'), { ssr: false })

interface Student {
  studentId: string
  displayName: string
  isAvailable: boolean
  status: string
}

interface IncomingCall {
  callId: string
  roomUrl: string
  callerName: string
  studentId: string
}

export default function LovedOneDashboard() {
  const [user, setUser] = useState<any>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [isMyAvailabilityOn, setIsMyAvailabilityOn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()
  const supabase = getSupabaseClient()
  const channelRef = useRef<any>(null)
  
  // Incoming call state
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null)
  const [activeCall, setActiveCall] = useState<{ callId: string; roomUrl: string; callerName: string } | null>(null)
  const [callingStudentId, setCallingStudentId] = useState<string | null>(null) // For outgoing calls
  const incomingChannelRef = useRef<any>(null)
  const callChannelRef = useRef<any>(null)

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/loved-one-login')
      return
    }
    setUser(user)
    fetchData(user.id)
  }

  const fetchData = async (userId: string) => {
    setIsRefreshing(true)
    try {
      // 1. Fetch my presence status
      const { data: myPresence } = await supabase
        .from('awy_presence')
        .select('is_available')
        .eq('user_id', userId)
        .single()
      
      if (myPresence) {
        setIsMyAvailabilityOn(myPresence.is_available)
      }

      // 2. Fetch connected students via API
      const { data: { session } } = await supabase.auth.getSession()
      const headers: HeadersInit = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const res = await fetch('/api/awy/presence/lovedone-view', { headers })
      const data = await res.json()
      
      if (data.ok) {
        setStudents(data.students)
      }
    } catch (error) {
      console.error('Refresh error:', error)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchUser()

    // Realtime Subscription
    if (!channelRef.current) {
      channelRef.current = supabase
        .channel('awy_dashboard_changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'awy_presence'
          },
          (payload) => {
            // Update local state if the updated user is one of our students
            setStudents(prev => prev.map(s => {
              if (s.studentId === payload.new.user_id) {
                return {
                  ...s,
                  isAvailable: payload.new.is_available,
                  status: payload.new.status || 'online'
                }
              }
              return s
            }))
          }
        )
        .subscribe()
    }

    // Fallback polling
    const interval = setInterval(() => {
      if (user) fetchData(user.id)
    }, 15000)

    // Initial heartbeat on mount
    const sendHeartbeat = async () => {
      const { error } = await supabase.rpc('awy_heartbeat', { p_is_available: true }); // Default to available on login
      if (error) console.warn('Heartbeat failed:', error.message);
      setIsMyAvailabilityOn(true); // Sync local state
    };
    if (user) sendHeartbeat();

    // Periodic heartbeat (every 30s) - pass null to preserve current availability
    const heartbeatInterval = setInterval(async () => {
      if (!user) return;
      await supabase.rpc('awy_heartbeat', { p_is_available: null }); // Keep alive, preserve availability
    }, 30000);

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
      clearInterval(interval)
      clearInterval(heartbeatInterval)
    }
  }, [supabase, user])

  const toggleAvailability = async () => {
    const newState = !isMyAvailabilityOn
    setIsMyAvailabilityOn(newState) // Optimistic update
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const res = await fetch('/api/awy/presence/update', {
        method: 'POST',
        headers,
        body: JSON.stringify({ is_available: newState })
      })
      
      if (!res.ok) throw new Error('Failed to update')
      toast.success(newState ? "You are now visible to your student" : "You are now hidden")
    } catch (error) {
      setIsMyAvailabilityOn(!newState) // Revert
      toast.error('Failed to update status')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/loved-one-login')
  }

  // === INCOMING CALL HANDLING ===
  useEffect(() => {
    if (!user?.id) return
    
    // Subscribe to incoming calls (where we are the receiver, not the caller)
    const channel = supabase
      .channel('incoming-calls')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'awy_calls',
          filter: `loved_one_id=eq.${user.id}`
        },
        async (payload: any) => {
          // CRITICAL: Only show incoming call if WE are not the caller
          if (payload.new.status === 'ringing' && payload.new.caller_id !== user.id) {
            // Get caller name from students list
            const caller = students.find(s => s.studentId === payload.new.student_id)
            setIncomingCall({
              callId: payload.new.id,
              roomUrl: payload.new.room_url,
              callerName: caller?.displayName || 'Your Student',
              studentId: payload.new.student_id
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
          filter: `loved_one_id=eq.${user.id}`
        },
        (payload: any) => {
          // Handle call ended by caller
          if (['ended', 'missed'].includes(payload.new.status)) {
            if (incomingCall?.callId === payload.new.id) {
              setIncomingCall(null)
              toast.error('Call ended')
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
    
    // Also check for any existing ringing calls on load
    const checkExistingCalls = async () => {
      const { data: calls } = await supabase
        .from('awy_calls')
        .select('*')
        .eq('loved_one_id', user.id)
        .neq('caller_id', user.id) // Exclude our own outgoing calls
        .eq('status', 'ringing')
        .order('created_at', { ascending: false })
        .limit(1)
      
      if (calls && calls.length > 0) {
        const call = calls[0]
        const caller = students.find(s => s.studentId === call.student_id)
        setIncomingCall({
          callId: call.id,
          roomUrl: call.room_url,
          callerName: caller?.displayName || 'Your Student',
          studentId: call.student_id
        })
      }
    }
    checkExistingCalls()
    
    return () => {
      if (incomingChannelRef.current) {
        supabase.removeChannel(incomingChannelRef.current)
      }
    }
  }, [user?.id, students, supabase])
  
  // Loved one initiating call to student
  const startCall = async (studentId: string, studentName: string) => {
    if (!user || callingStudentId) return
    
    setCallingStudentId(studentId)
    
    try {
      const res = await fetch('/api/awy/call/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ lovedOneId: studentId }) // We're the loved one, calling the student
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to start call')
      }
      
      const { callId, roomUrl } = data
      
      // Subscribe to call status updates
      const channel = supabase
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
              setActiveCall({ callId, roomUrl, callerName: studentName })
              setCallingStudentId(null)
              toast.success(`${studentName} accepted your call!`)
            } else if (status === 'declined') {
              toast.error(`${studentName} declined the call`)
              setCallingStudentId(null)
            } else if (status === 'ended' || status === 'missed') {
              setCallingStudentId(null)
              setActiveCall(null)
            }
          }
        )
        .subscribe()
      
      callChannelRef.current = channel
      toast.success(`Calling ${studentName}...`)
      
      // Auto-timeout after 30s
      setTimeout(() => {
        if (callingStudentId === studentId) {
          handleEndCall()
          toast.error('Call timed out - no answer')
        }
      }, 30000)
      
    } catch (err: any) {
      console.error('[LovedOne] Start call error:', err)
      toast.error(err.message || 'Failed to start call')
      setCallingStudentId(null)
    }
  }
  
  const handleAcceptCall = () => {
    if (!incomingCall) return
    setActiveCall({
      callId: incomingCall.callId,
      roomUrl: incomingCall.roomUrl,
      callerName: incomingCall.callerName
    })
    setIncomingCall(null)
  }
  
  const handleDeclineCall = () => {
    setIncomingCall(null)
  }
  
  const handleEndCall = async () => {
    if (!activeCall) return
    try {
      await fetch('/api/awy/call/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ callId: activeCall.callId })
      })
    } catch (err) {
      console.error('End call error:', err)
    }
    // Cleanup
    if (callChannelRef.current) {
      supabase.removeChannel(callChannelRef.current)
      callChannelRef.current = null
    }
    setActiveCall(null)
    setCallingStudentId(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-red-50">
      <Head>
        <title>Loved One Dashboard - MyDurhamLaw</title>
      </Head>

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
            <span className="font-bold text-gray-900 text-lg">Always With You</span>
          </div>
          <div className="flex items-center space-x-4">
            <UKTimeDisplay size="sm" variant="inline" />
            <button 
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700 flex items-center text-sm"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Status Indicator - Loved ones are always visible when logged in */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6 text-green-600 fill-green-600" />
              </div>
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse"></span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">You're Connected</h2>
              <p className="text-sm text-green-600 font-medium">
                Your student can see you're online
              </p>
            </div>
          </div>
        </div>

        {/* Connected Students */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Connected Students</h3>
          <button 
            onClick={() => user && fetchData(user.id)} 
            className={`text-gray-400 hover:text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-4">
          {students.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 border-dashed">
              <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No students connected yet.</p>
              <p className="text-sm text-gray-400 mt-2">Ask your student to add you via their settings.</p>
            </div>
          ) : (
            students.map(student => (
              <div key={student.studentId} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xl font-bold">
                      {student.displayName.charAt(0)}
                    </div>
                    {student.isAvailable && (
                      <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse"></span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">{student.displayName}</h4>
                    <p className={`text-sm font-medium ${student.isAvailable ? 'text-green-600' : 'text-gray-500'}`}>
                      {student.isAvailable ? 'Online & Available' : 'Offline'}
                    </p>
                  </div>
                </div>

                {student.isAvailable ? (
                  <button
                    onClick={() => startCall(student.studentId, student.displayName)}
                    disabled={callingStudentId === student.studentId}
                    className={`inline-flex items-center px-4 py-2 border rounded-full text-sm font-medium transition-all ${
                      callingStudentId === student.studentId
                        ? 'border-yellow-300 text-yellow-700 bg-yellow-50 animate-pulse'
                        : 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100 hover:border-green-300 cursor-pointer'
                    }`}
                  >
                    {callingStudentId === student.studentId ? (
                      <>
                        <Phone className="w-4 h-4 mr-2 animate-bounce" />
                        Calling...
                      </>
                    ) : (
                      <>
                        <Video className="w-4 h-4 mr-2" />
                        Call Now
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    disabled
                    className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-full text-sm font-medium text-gray-400 bg-gray-50 cursor-not-allowed"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Offline
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
          <p>
            <strong>Note:</strong> You can only call your student when they have marked themselves as available (green dot). This ensures you connect at the right time.
          </p>
        </div>
      </main>
      
      {/* Incoming Call Modal */}
      {incomingCall && (
        <IncomingCallModal
          callId={incomingCall.callId}
          callerName={incomingCall.callerName}
          onAccept={handleAcceptCall}
          onDecline={handleDeclineCall}
        />
      )}
      
      {/* Active Call Modal */}
      {activeCall && (
        <DailyCallModal
          roomUrl={activeCall.roomUrl}
          callId={activeCall.callId}
          callerName={activeCall.callerName}
          onHangup={handleEndCall}
        />
      )}
    </div>
  )
}