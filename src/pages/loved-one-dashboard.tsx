'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { Heart, Calendar, BookOpen, Clock, FileText, User, MapPin, Moon, Sun, Video, MessageCircle, Settings, ExternalLink } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { BrandTitle } from '@/components/ui/BrandTitle'
import { UKTimeDisplay } from '@/components/ui/UKTimeDisplay'
import toast from 'react-hot-toast'

interface StudentProfile {
  id: string
  display_name: string
  user_type: string
  sharing_settings: any
  last_seen?: string
  current_activity?: string
  is_online?: boolean
}

interface CalendarEvent {
  title: string
  date: string
  time: string
  type: 'lecture' | 'seminar' | 'exam' | 'assignment' | 'personal'
}

interface SharedNote {
  id: string
  title: string
  content: string
  created_at: string
  is_shared_with_parents: boolean
}

export default function LovedOneDashboard() {
  const router = useRouter()
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  const [parentEmail, setParentEmail] = useState<string | null>(null)
  const [parentRelationship, setParentRelationship] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [todaysEvents, setTodaysEvents] = useState<CalendarEvent[]>([])
  const [sharedNotes, setSharedNotes] = useState<SharedNote[]>([])
  const [upcomingExams, setUpcomingExams] = useState<CalendarEvent[]>([])

  const loadStudentProfile = useCallback(async (studentId: string, email: string) => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        toast.error('Unable to connect to database');
        return;
      }
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, display_name, user_type, sharing_settings, parent1_email, parent1_relationship, parent1_display_name, parent2_email, parent2_relationship, parent2_display_name')
        .eq('id', studentId)
        .single()

      if (error || !profile) {
        toast.error('Failed to load student information')
        return
      }

      // Determine relationship
      let relationship = 'Loved One'
      if (profile.parent1_email === email) {
        relationship = profile.parent1_relationship || 'Parent'
      } else if (profile.parent2_email === email) {
        relationship = profile.parent2_relationship || 'Parent'
      }

      setParentRelationship(relationship)
      setStudentProfile(profile)

      // Load additional data based on sharing settings
      if (profile.sharing_settings?.share_today_calendar) {
        await loadTodaysCalendar(studentId)
      }

      if (profile.sharing_settings?.share_custom_notes) {
        await loadSharedNotes(studentId)
      }

      await loadUpcomingExams(studentId)
      await loadPresenceData(studentId)

    } catch (error) {
      console.error('Failed to load student profile:', error)
      toast.error('Failed to load student information')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const authenticateParent = useCallback(async () => {
    try {
      // Get auth details from session storage
      const token = sessionStorage.getItem('parent_token')
      const email = sessionStorage.getItem('parent_email')
      const studentId = sessionStorage.getItem('student_id')

      if (!token || !email || !studentId) {
        router.push('/loved-one-login')
        return
      }

      const supabase = getSupabaseClient();
      if (!supabase) {
        toast.error('Unable to connect to authentication service');
        router.push('/loved-one-login');
        return;
      }

      // Verify token is still valid
      const { data: tokenData, error: tokenError } = await supabase
        .from('parent_session_tokens')
        .select('*')
        .eq('token_hash', token)
        .eq('parent_email', email)
        .eq('student_id', studentId)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (tokenError || !tokenData) {
        toast.error('Session expired. Please log in again.')
        router.push('/loved-one-login')
        return
      }

      // Update last used timestamp
      await supabase
        .from('parent_session_tokens')
        .update({ 
          last_used_at: new Date().toISOString(),
          is_active: true
        })
        .eq('id', tokenData.id)

      setParentEmail(email)

      // Load student profile
      await loadStudentProfile(studentId, email)

    } catch (error) {
      console.error('Authentication error:', error)
      router.push('/loved-one-login')
    }
  }, [router, loadStudentProfile])

  useEffect(() => {
    authenticateParent()
  }, [authenticateParent])

  const loadTodaysCalendar = async (studentId: string) => {
    // Mock data - in production, integrate with actual calendar
    const today = new Date().toISOString().split('T')[0] as string;
    const mockEvents: CalendarEvent[] = [
      {
        title: 'Contract Law Lecture',
        date: today,
        time: '09:00',
        type: 'lecture'
      },
      {
        title: 'Criminal Law Seminar',
        date: today,
        time: '14:00',
        type: 'seminar'
      },
      {
        title: 'Study Group - Tort Law',
        date: today,
        time: '16:30',
        type: 'personal'
      }
    ]

    setTodaysEvents(mockEvents)
  }

  const loadSharedNotes = async (studentId: string) => {
    try {
      // Mock data - in production, load from actual notes table
      const mockNotes: SharedNote[] = [
        {
          id: '1',
          title: 'This Week\'s Goals',
          content: 'Focus on contract formation principles. Review offer and acceptance cases. Complete assignment outline by Friday.',
          created_at: new Date().toISOString(),
          is_shared_with_parents: true
        },
        {
          id: '2',
          title: 'Study Update',
          content: 'Making good progress on tort law. The negligence cases are starting to make sense. Planning to visit the library tomorrow.',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          is_shared_with_parents: true
        }
      ]

      setSharedNotes(mockNotes)
    } catch (error) {
      console.error('Failed to load shared notes:', error)
    }
  }

  const loadUpcomingExams = async (studentId: string) => {
    // Mock exam data
    const oneWeekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] as string;
    const twoWeeksFromNow = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] as string;
    
    const mockExams: CalendarEvent[] = [
      {
        title: 'Contract Law Mid-term',
        date: oneWeekFromNow,
        time: '10:00',
        type: 'exam'
      },
      {
        title: 'Criminal Law Essay',
        date: twoWeeksFromNow,
        time: '23:59',
        type: 'assignment'
      }
    ]

    setUpcomingExams(mockExams)
  }

  const loadPresenceData = async (studentId: string) => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        console.error('Supabase client not available for presence data');
        return;
      }
      
      const { data: presence } = await supabase
        .from('user_presence')
        .select('*')
        .eq('user_id', studentId)
        .single()

      if (presence) {
        setStudentProfile(prev => prev ? {
          ...prev,
          is_online: presence.is_online,
          last_seen: presence.last_seen,
          current_activity: presence.activity
        } : null)
      }
    } catch (error) {
      console.error('Failed to load presence data:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }

  const formatTime = (timeString: string) => {
    return timeString
  }

  const getEventIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'lecture':
        return <BookOpen className="w-4 h-4" />
      case 'seminar':
        return <User className="w-4 h-4" />
      case 'exam':
        return <FileText className="w-4 h-4" />
      case 'assignment':
        return <FileText className="w-4 h-4" />
      case 'personal':
        return <Clock className="w-4 h-4" />
      default:
        return <Calendar className="w-4 h-4" />
    }
  }

  const getEventColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'lecture':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'seminar':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'exam':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'assignment':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'personal':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const initiateVideoCall = async () => {
    if (!studentProfile || !parentEmail) return

    toast.success('Initiating video call... Your student will be notified.')
    
    // In production, this would integrate with the video call service
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        toast.error('Unable to connect to call service');
        return;
      }
      
      // Create call session
      const { error } = await supabase
        .from('video_call_sessions')
        .insert({
          student_id: studentProfile.id,
          parent_email: parentEmail,
          status: 'ringing'
        })

      if (error) throw error

      toast.success('Call initiated! Waiting for your student to answer...')
    } catch (error) {
      console.error('Failed to initiate call:', error)
      toast.error('Failed to start video call')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!studentProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">Unable to load student information.</p>
          <button
            onClick={() => router.push('/loved-one-login')}
            className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>{studentProfile.display_name} - Always With You Dashboard</title>
        <meta name="description" content="Stay connected with your student through MyDurhamLaw" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-red-50">
        
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-r from-pink-500 to-red-500 p-3 rounded-full">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Always With You
                  </h1>
                  <BrandTitle variant="light" size="sm" as="span" className="text-gray-600" />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <UKTimeDisplay 
                  showLabel={true}
                  showIcon={true}
                  size="sm"
                  variant="inline"
                />
                <button
                  onClick={() => {
                    sessionStorage.clear()
                    router.push('/loved-one-login')
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Student Status Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {studentProfile.display_name.charAt(0)}
                  </div>
                  {studentProfile.is_online && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full animate-pulse">
                      <Heart className="w-3 h-3 text-white absolute inset-0.5" />
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    {studentProfile.display_name}
                  </h2>
                  <p className="text-gray-600 capitalize">
                    {studentProfile.user_type?.replace('_', ' ')} • Durham Law Student
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    {studentProfile.is_online ? (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-600 font-medium">Online now</span>
                        {studentProfile.current_activity && (
                          <span className="text-sm text-gray-500">• {studentProfile.current_activity}</span>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-sm text-gray-500">
                          Last seen {studentProfile.last_seen ? new Date(studentProfile.last_seen).toLocaleString('en-GB') : 'recently'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={initiateVideoCall}
                  disabled={!studentProfile.is_online}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    studentProfile.is_online
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Video className="w-4 h-4" />
                  <span>Video Call</span>
                </button>
                <button
                  disabled={!studentProfile.is_online}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    studentProfile.is_online
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Message</span>
                </button>
              </div>
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Today's Schedule */}
              {studentProfile.sharing_settings?.share_today_calendar && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Today&apos;s Schedule</h3>
                  </div>
                  
                  {todaysEvents.length > 0 ? (
                    <div className="space-y-3">
                      {todaysEvents.map((event, index) => (
                        <div key={index} className={`flex items-center space-x-3 p-3 rounded-lg border ${getEventColor(event.type)}`}>
                          {getEventIcon(event.type)}
                          <div className="flex-1">
                            <p className="font-medium">{event.title}</p>
                            <p className="text-sm opacity-75">{formatTime(event.time)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No scheduled events for today</p>
                  )}
                </div>
              )}

              {/* Shared Notes */}
              {studentProfile.sharing_settings?.share_custom_notes && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <FileText className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Shared Notes</h3>
                  </div>
                  
                  {sharedNotes.length > 0 ? (
                    <div className="space-y-4">
                      {sharedNotes.map((note) => (
                        <div key={note.id} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{note.title}</h4>
                            <span className="text-xs text-gray-500">
                              {new Date(note.created_at).toLocaleDateString('en-GB')}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm leading-relaxed">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No shared notes yet</p>
                  )}
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              
              {/* Upcoming Exams */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <FileText className="w-5 h-5 text-red-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Upcoming Exams</h3>
                </div>
                
                {upcomingExams.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingExams.map((exam, index) => (
                      <div key={index} className={`p-3 rounded-lg border ${getEventColor(exam.type)}`}>
                        <div className="flex items-center space-x-2 mb-1">
                          {getEventIcon(exam.type)}
                          <p className="font-medium text-sm">{exam.title}</p>
                        </div>
                        <p className="text-xs opacity-75">
                          {formatDate(exam.date)} at {formatTime(exam.time)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4 text-sm">No upcoming exams</p>
                )}
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Study Time Today</span>
                    <span className="font-medium text-gray-900">4h 30m</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Assignments Due</span>
                    <span className="font-medium text-orange-600">2</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Next Exam</span>
                    <span className="font-medium text-red-600">7 days</span>
                  </div>
                </div>
              </div>

              {/* Relationship Info */}
              <div className="bg-gradient-to-r from-pink-500 to-red-500 rounded-lg p-6 text-white">
                <div className="flex items-center space-x-2 mb-3">
                  <Heart className="w-5 h-5" />
                  <h3 className="font-semibold">Your Connection</h3>
                </div>
                <p className="text-pink-100 text-sm mb-3">
                  You&apos;re logged in as <strong>{studentProfile.display_name}&apos;s {parentRelationship}</strong>
                </p>
                <p className="text-pink-100 text-xs">
                  Information shown is controlled by your student&apos;s sharing preferences.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-12 pb-8">
            <p className="text-sm text-gray-500 mb-2">
              Powered by MyDurhamLaw • Always With You Feature
            </p>
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
              <button className="hover:text-gray-600 flex items-center space-x-1">
                <Settings className="w-3 h-3" />
                <span>Sharing Settings</span>
              </button>
              <button className="hover:text-gray-600 flex items-center space-x-1">
                <ExternalLink className="w-3 h-3" />
                <span>Support</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}