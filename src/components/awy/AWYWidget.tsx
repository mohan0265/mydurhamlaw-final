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
              isAvailable: presMap.get(c.loved_one_id)?.is_available || false,
              status: presMap.get(c.loved_one_id)?.status || 'offline',
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
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-4">
      {/* Main Widget */}
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-xl border border-pink-100 p-4 w-80 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <Heart className="w-4 h-4 text-pink-500 mr-2 fill-pink-500" />
              Always With You
            </h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* My Status Toggle */}
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl mb-4">
            <span className="text-sm text-gray-600">I'm Available</span>
            <button
              onClick={toggleAvailability}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 ${
                isMyAvailabilityOn ? 'bg-pink-500' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isMyAvailabilityOn ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Connections List */}
          <div className="space-y-3">
            {connections.length === 0 ? (
              <div className="text-center py-4 text-gray-400 text-sm">
                No active connections.
              </div>
            ) : (
              connections.map(conn => (
                <div key={conn.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold">
                        {conn.displayName.charAt(0)}
                      </div>
                      {conn.isAvailable && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{conn.displayName}</p>
                      <p className="text-xs text-gray-500">
                        {conn.isAvailable ? 'Available' : 'Away'}
                      </p>
                    </div>
                  </div>
                  
                  {conn.isAvailable && (
                    <a
                      href={getJitsiUrl(conn.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-pink-100 text-pink-600 rounded-full hover:bg-pink-200 transition-colors"
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
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center justify-center w-14 h-14 bg-white border-2 border-pink-100 rounded-full shadow-lg hover:border-pink-200 hover:shadow-xl transition-all duration-200"
      >
        <div className="relative">
          <Heart className={`w-6 h-6 text-pink-500 transition-transform duration-200 ${isOpen ? 'scale-110 fill-pink-500' : 'group-hover:scale-110'}`} />
          {/* Online Indicator Badge if anyone is online */}
          {connections.some(c => c.isAvailable) && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse"></span>
          )}
        </div>
      </button>
    </div>
  )
}
