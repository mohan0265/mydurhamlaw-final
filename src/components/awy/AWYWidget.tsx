'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Heart, Video, X, Loader2 } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import toast from 'react-hot-toast'

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
  const [userId, setUserId] = useState<string | null>(null)
  
  const supabase = createClientComponentClient()
  const channelRef = useRef<any>(null)

  // Fetch initial data
  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)

      // Get role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      const role = profile?.role || 'student'
      setUserRole(role)

      // Get my status
      const { data: myPresence } = await supabase
        .from('awy_presence')
        .select('is_available')
        .eq('user_id', user.id)
        .single()
      
      if (myPresence) setIsMyAvailabilityOn(myPresence.is_available)

      // Fetch connections based on role
      if (role === 'loved_one') {
        const res = await fetch('/api/awy/presence/lovedone-view')
        const data = await res.json()
        if (data.ok) {
          setConnections(data.students.map((s: any) => ({
            id: s.studentId,
            displayName: s.displayName,
            isAvailable: s.isAvailable,
            status: s.status,
            role: 'student'
          })))
        }
      } else {
        const res = await fetch('/api/awy/presence/student-view')
        const data = await res.json()
        if (data.ok) {
          const connRes = await fetch('/api/awy/loved-ones')
          const connData = await connRes.json()
          
          if (connData.ok) {
            const presMap = new Map(data.presence.map((p: any) => [p.user_id, p]))
            
            const list = connData.connections.map((c: any) => ({
              id: c.loved_one_id,
              displayName: c.nickname || c.relationship || 'Loved One',
              isAvailable: (presMap.get(c.loved_one_id) as any)?.is_available || false,
              status: (presMap.get(c.loved_one_id) as any)?.status || 'offline',
              role: 'loved_one'
            })).filter((c: any) => c.id) // Only active connections
            
            setConnections(list)
          }
        }
      }
    } catch (err) {
      console.error('AWY fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Realtime Subscription
    if (!channelRef.current) {
      channelRef.current = supabase
        .channel('awy_presence_changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'awy_presence'
          },
          (payload) => {
            // Update local state if the updated user is in our list
            setConnections(prev => prev.map(c => {
              if (c.id === payload.new.user_id) {
                return {
                  ...c,
                  isAvailable: payload.new.is_available,
                  status: payload.new.status || 'online'
                }
              }
              return c
            }))
          }
        )
        .subscribe()
    }

    // Fallback polling every 15s
    const interval = setInterval(fetchData, 15000)

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
      clearInterval(interval)
    }
  }, [supabase])

  const toggleAvailability = async () => {
    const newState = !isMyAvailabilityOn
    setIsMyAvailabilityOn(newState)
    try {
      await fetch('/api/awy/presence/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_available: newState })
      })
      toast.success(newState ? "You are now visible" : "You are hidden")
    } catch (error) {
      setIsMyAvailabilityOn(!newState)
      toast.error('Failed to update status')
    }
  }

  const getJitsiUrl = (otherId: string) => {
    if (!userId) return '#'
    // Consistent room name: MyDurhamLaw-{studentId}-{lovedOneId}
    // We need to know who is who.
    // If I am student, other is lovedOne. Room: MyDurhamLaw-{me}-{other}
    // If I am lovedOne, other is student. Room: MyDurhamLaw-{other}-{me}
    
    const studentId = userRole === 'student' ? userId : otherId
    const lovedOneId = userRole === 'student' ? otherId : userId
    
    return `https://meet.jit.si/MyDurhamLaw-${studentId}-${lovedOneId}`
  }

  if (loading) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-4 group">
      {/* Main Widget */}
      {isOpen && (
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
                <span className="text-sm font-semibold text-gray-800">I'm Available</span>
                <span className="text-xs text-gray-500">Let them know you're free</span>
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
      )}

      {/* Tooltip - Only show when closed */}
      {!isOpen && (
        <div className="absolute right-full mr-4 bottom-2 w-max opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none translate-x-2 group-hover:translate-x-0">
          <div className="bg-gray-900/90 backdrop-blur-sm text-white text-xs py-2.5 px-4 rounded-xl shadow-xl border border-white/10">
            <div className="font-bold mb-0.5 text-pink-200">Always With You</div>
            <div className="text-gray-300">Stay close to the people who care about you.</div>
          </div>
          {/* Arrow */}
          <div className="absolute bottom-4 -right-1.5 w-3 h-3 bg-gray-900/90 rotate-45 border-t border-r border-white/10"></div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center justify-center w-14 h-14 bg-white border-2 border-pink-100 rounded-full shadow-lg hover:border-pink-200 hover:shadow-xl transition-all duration-200 hover:scale-105"
      >
        <div className="relative">
          <Heart className={`w-6 h-6 text-pink-500 transition-transform duration-200 ${isOpen ? 'scale-110 fill-pink-500' : 'group-hover:scale-110'}`} />
          {/* Online Indicator Badge if anyone is online */}
          {connections.some(c => c.isAvailable) && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full animate-pulse shadow-sm"></span>
          )}
        </div>
      </button>
    </div>
  )
}
