'use client'

import React, { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import { Heart, LogOut, User, RefreshCw } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { UKTimeDisplay } from '@/components/ui/UKTimeDisplay'
import { StatusUpdateModal } from '@/components/awy/StatusUpdateModal'

interface Student {
  studentId: string
  displayName: string
  isAvailable: boolean
  status: string
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
  
  // Status State
  const [availabilityStatus, setAvailabilityStatus] = useState<'available' | 'busy' | 'dnd'>('busy')
  const [availabilityNote, setAvailabilityNote] = useState<string | null>(null)
  const [showStatusModal, setShowStatusModal] = useState(false)

  // Update Status Logic (Mirroring Widget)
  const updateStatus = async (status: 'available' | 'busy' | 'dnd', note: string | null, expiryMinutes: number | null) => {
    if (!user) return

    const expiresAt = expiryMinutes ? new Date(Date.now() + expiryMinutes * 60000).toISOString() : null
    
    setAvailabilityStatus(status)
    setAvailabilityNote(note)
    setIsMyAvailabilityOn(status === 'available')
    
    try {
      const { error } = await supabase.rpc('awy_update_presence', {
        p_is_available: status === 'available',
        p_status: status,
        p_note: note,
        p_expires_at: expiresAt,
        p_note_expires_at: expiresAt
      })

      if (error) {
         const code = (error as any)?.code
         const msg = (error.message || '').toLowerCase()
         if (code === 'PGRST202' || msg.includes('function') && (msg.includes('not found') || msg.includes('could not find'))) {
            await supabase.rpc('awy_heartbeat', { p_is_available: status === 'available' })
         } else {
            throw error
         }
      }
      toast.success('Status updated')
      fetchData(user.id)
    } catch (err) {
      console.error('Failed to update status:', err)
      toast.error('Failed to update status')
    }
  }

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

  const isMyAvailabilityOnRef = useRef(isMyAvailabilityOn)
  useEffect(() => {
    isMyAvailabilityOnRef.current = isMyAvailabilityOn
  }, [isMyAvailabilityOn])

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


    // Periodic heartbeat (every 30s) - send explicit state to prevent reset
    const heartbeatInterval = setInterval(async () => {
      if (!user) return;
      await supabase.rpc('awy_heartbeat', { p_is_available: isMyAvailabilityOnRef.current });
    }, 30000);
  


    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
      clearInterval(interval)
      clearInterval(heartbeatInterval)
    }
  }, [supabase, user])

  const toggleAvailability = async () => {
    if (!user) return
    const newState = !isMyAvailabilityOn
    setIsMyAvailabilityOn(newState)
    
    try {
      const { error } = await supabase.rpc('awy_heartbeat', { p_is_available: newState })
      if (error) throw error
      toast.success(newState ? "You are now visible" : "You are hidden")
    } catch (err) {
      console.error('Failed to toggle availability:', err)
      setIsMyAvailabilityOn(!newState) // Revert on error
      toast.error('Failed to update status')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/loved-one-login')
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
        
        {/* Status Indicator & Visibility Toggle */}

        {/* Status Section - 3-State Control for Loved Ones */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
           <div className="flex items-center justify-between mb-4">
             <div>
                <h2 className="text-lg font-bold text-gray-900">Your Availability</h2>
                 <p className="text-sm text-gray-500">
                   {availabilityNote ? `Note: ${availabilityNote}` : "Select your status to let your student know you're around."}
                 </p>
             </div>
             <button
                onClick={() => setShowStatusModal(true)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
              >
                Detailed Options
              </button>
           </div>
           
           <div className="grid grid-cols-3 gap-4">
              <button
                 onClick={() => updateStatus('available', availabilityNote, null)}
                 className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    availabilityStatus === 'available' 
                      ? 'bg-green-50 border-green-500 text-green-700' 
                      : 'bg-white border-gray-100 hover:border-gray-200 text-gray-500'
                 }`}
              >
                 <div className={`w-4 h-4 rounded-full mb-2 ${availabilityStatus === 'available' ? 'bg-green-500' : 'bg-gray-300'}`} />
                 <span className="font-bold">Available</span>
              </button>

              <button
                 onClick={() => updateStatus('busy', availabilityNote, null)}
                 className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    availabilityStatus === 'busy' 
                      ? 'bg-orange-50 border-orange-500 text-orange-700' 
                      : 'bg-white border-gray-100 hover:border-gray-200 text-gray-500'
                 }`}
              >
                 <div className={`w-4 h-4 rounded-full mb-2 ${availabilityStatus === 'busy' ? 'bg-orange-500' : 'bg-gray-300'}`} />
                 <span className="font-bold">Busy</span>
              </button>

              <button
                 onClick={() => updateStatus('dnd', availabilityNote, null)}
                 className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    availabilityStatus === 'dnd' 
                      ? 'bg-red-50 border-red-500 text-red-700' 
                      : 'bg-white border-gray-100 hover:border-gray-200 text-gray-500'
                 }`}
              >
                 <div className={`w-4 h-4 rounded-full mb-2 ${availabilityStatus === 'dnd' ? 'bg-red-500' : 'bg-gray-300'}`} />
                 <span className="font-bold">Do Not Disturb</span>
              </button>
           </div>
        </div>

        {/* Status Modal Render */}
        {showStatusModal && (
           <StatusUpdateModal 
             currentStatus={availabilityStatus} 
             currentNote={availabilityNote}
             onUpdate={updateStatus}
             onClose={() => setShowStatusModal(false)}
           />
        )}

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
                  <div className="bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium border border-green-100">
                    Online
                  </div>
                ) : (
                  <div className="bg-gray-50 text-gray-500 px-4 py-2 rounded-full text-sm font-medium border border-gray-200">
                    Offline
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
          <p>
             Use the details your student provided (WhatsApp, FaceTime) to contact them when they are available.
          </p>
        </div>
      </main>
    </div>
  )
}