'use client'

import React, { useState, useEffect, useContext } from 'react'
import { useRouter } from 'next/router'
import { getSupabaseClient } from '@/lib/supabase/client'
import { AuthContext } from '@/lib/supabase/AuthContext'
import { getModulesForYear, getUserAcademicYear, AcademicModule } from '@/lib/academic/academicData'
import ModernSidebar from '@/components/layout/ModernSidebar'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card'
import BackToHomeButton from '@/components/ui/BackToHomeButton'
import { useScrollToTop } from '@/hooks/useScrollToTop'
import { Calendar, Clock, ArrowLeft, Plus, ChevronLeft, ChevronRight, Grid, List, Eye } from 'lucide-react'
// Voice functionality now integrated into DurmahWidget
// import { VoiceButton } from '@/components/voice/VoiceButton'

// Types for schedule management
interface TimetableEvent {
  id: string
  title: string
  type: 'lecture' | 'tutorial' | 'seminar' | 'workshop' | 'exam'
  day: number // 0-6 (Sunday-Saturday)
  startTime: string
  endTime: string
  location?: string
  lecturer?: string
  color: string
}

interface CalendarEvent {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  type: 'assignment' | 'exam' | 'study' | 'personal'
  description?: string
  priority: 'high' | 'medium' | 'low'
}

export default function StudySchedulePage() {
  useScrollToTop()
  
  const router = useRouter()
  const authContext = useContext(AuthContext)
  const { getDashboardRoute, userType } = authContext || { getDashboardRoute: () => '/dashboard', userType: null }
  const [user, setUser] = useState<any>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'timetable' | 'calendar'>('timetable')
  const [calendarView, setCalendarView] = useState<'week' | 'month' | 'year'>('week')
  const [userModules, setUserModules] = useState<AcademicModule[]>([])
  
  // Current date state for calendar navigation
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentWeek, setCurrentWeek] = useState(new Date())
  
  // Dynamic timetable data based on user's academic modules
  const [timetableEvents, setTimetableEvents] = useState<TimetableEvent[]>([])

  // Generate timetable events from academic modules
  const generateTimetableFromModules = (modules: AcademicModule[]): TimetableEvent[] => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 'bg-orange-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500']
    const locations = ['Law Building A101', 'Law Building A201', 'Law Building B205', 'Tutorial Room 1', 'Tutorial Room 2', 'Tutorial Room 3', 'Library Seminar Room', 'Moot Court Room']
    const lecturers = ['Prof. Smith', 'Dr. Johnson', 'Prof. Brown', 'Dr. Davis', 'Ms. Wilson', 'Prof. Taylor', 'Dr. Anderson', 'Prof. Martin']
    
    const events: TimetableEvent[] = []
    
    modules.forEach((module, index) => {
      // Create 1-2 sessions per module spread across the week
      const sessionsPerModule = Math.min(2, Math.max(1, Math.floor(Math.random() * 2) + 1))
      
      for (let sessionIndex = 0; sessionIndex < sessionsPerModule; sessionIndex++) {
        const baseId = `${index}-${sessionIndex}`
        const day = (index * 2 + sessionIndex + 1) % 5 + 1 // Distribute across Monday-Friday (1-5)
        const startHour = 9 + Math.floor(Math.random() * 7) // 9 AM to 3 PM
        const duration = sessionIndex === 0 ? 2 : 1 // First session is lecture (2hrs), second is tutorial (1hr)
        
        events.push({
          id: baseId,
          title: module.name,
          type: sessionIndex === 0 ? 'lecture' : 'tutorial',
          day,
          startTime: `${startHour.toString().padStart(2, '0')}:00`,
          endTime: `${(startHour + duration).toString().padStart(2, '0')}:00`,
          location: locations[index % locations.length] || 'TBD',
          lecturer: lecturers[index % lecturers.length] || 'TBD',
          color: colors[index % colors.length] || 'bg-gray-500'
        })
      }
    })
    
    return events
  }

  // Dynamic calendar events based on current date
  const getUpcomingDates = () => {
    const today = new Date();
    const d1 = new Date(today); d1.setDate(today.getDate() + 3);
    const d2 = new Date(today); d2.setDate(today.getDate() + 7);
    const d3 = new Date(today); d3.setDate(today.getDate() + 14);
    return {
      essay: d1.toISOString().split('T')[0],
      study: d2.toISOString().split('T')[0],
      exam: d3.toISOString().split('T')[0],
    };
  };
  const [upcomingDates] = useState(getUpcomingDates());
  
  const [calendarEvents] = useState<CalendarEvent[]>([
    {
      id: '1',
      title: 'Contract Law Essay Due',
      date: upcomingDates.essay as string,
      startTime: '23:59',
      endTime: '23:59',
      type: 'assignment',
      description: 'Submit 2000-word essay on contract formation',
      priority: 'high'
    },
    {
      id: '2',
      title: 'Study Session - Tort Cases',
      date: upcomingDates.study as string,
      startTime: '15:00',
      endTime: '17:00',
      type: 'study',
      description: 'Review landmark tort law cases',
      priority: 'medium'
    },
    {
      id: '3',
      title: 'Midterm Exam - Constitutional Law',
      date: upcomingDates.exam as string,
      startTime: '09:00',
      endTime: '12:00',
      type: 'exam',
      description: 'Comprehensive exam covering first half of semester',
      priority: 'high'
    }
  ])

  useEffect(() => {
    const getUser = async () => {
      const supabase = getSupabaseClient();
      if (!supabase) {
        router.push('/login');
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      } else {
        setUser(session.user)
      }
      setLoading(false)
    }
    getUser()
  }, [router])

  // Load user's academic modules and generate timetable
  useEffect(() => {
    if (userType) {
      const academicYear = getUserAcademicYear(userType)
      if (academicYear) {
        const modules = getModulesForYear(academicYear)
        setUserModules(modules)
        const events = generateTimetableFromModules(modules)
        setTimetableEvents(events)
      }
    }
  }, [userType])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-600">Loading Study Schedule...</p>
        </div>
      </div>
    )
  }

  // Helper functions
  const timeSlots = Array.from({ length: 11 }, (_, i) => {
    const hour = i + 8 // 8 AM to 6 PM
    return `${hour.toString().padStart(2, '0')}:00`
  })

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  const dayNamesLong = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

  const getTodayEvents = (): (TimetableEvent | CalendarEvent)[] => {
    const today = new Date().toISOString().split('T')[0]
    const todayDay = new Date().getDay()
    
    const timetableToday = timetableEvents.filter(event => event.day === todayDay)
    const calendarToday = calendarEvents.filter(event => event.date === today)
    
    const allEvents: (TimetableEvent | CalendarEvent)[] = [...timetableToday, ...calendarToday]
    
    return allEvents.sort((a, b) => {
      const timeA = a.startTime
      const timeB = b.startTime
      return timeA.localeCompare(timeB)
    })
  }

  const getEventsByDay = (dayIndex: number) => {
    return timetableEvents.filter(event => event.day === dayIndex)
  }

  const getDayWorkload = (dayIndex: number) => {
    const events = getEventsByDay(dayIndex)
    if (events.length === 0) return 'free'
    if (events.length <= 2) return 'light'
    if (events.length <= 4) return 'moderate'
    return 'heavy'
  }

  const getWorkloadColor = (workload: string) => {
    switch (workload) {
      case 'free': return 'bg-green-100 text-green-800'
      case 'light': return 'bg-blue-100 text-blue-800'
      case 'moderate': return 'bg-yellow-100 text-yellow-800'
      case 'heavy': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <ModernSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-72'} lg:ml-0`}>
        <BackToHomeButton />
        <main className="p-3 sm:p-6 space-y-4 sm:space-y-8 max-w-full mx-auto">
          {/* Header */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => router.push(getDashboardRoute())}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-200 text-gray-600 hover:text-blue-600 min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </button>

            <Card gradient className="flex-1">
              <CardContent className="py-3 sm:py-4">
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-lg sm:text-2xl">
                    <Calendar className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-2xl font-bold text-gray-800">Study Schedule</h1>
                    <p className="text-sm sm:text-base text-gray-600 hidden sm:block">Professional timetable and calendar management</p>
                    <p className="text-xs text-gray-600 sm:hidden">Timetable & calendar</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daily Schedule Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Today&apos;s Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getTodayEvents().length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No events scheduled for today</p>
                ) : (
                  getTodayEvents().map((event, index) => (
                    <div key={index} className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-8 sm:h-12 bg-blue-500 rounded-full"></div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-800 text-sm sm:text-base truncate">{event.title}</h4>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">
                          {event.startTime} - {event.endTime}
                          {'location' in event && event.location && ` • ${event.location}`}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {event.type}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tab Navigation */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="bg-white rounded-xl shadow-lg border border-white/20 p-1">
              <button
                onClick={() => setActiveTab('timetable')}
                className={`px-3 sm:px-6 py-2 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base min-h-[44px] flex items-center justify-center ${
                  activeTab === 'timetable'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                Weekly Timetable
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`px-3 sm:px-6 py-2 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base min-h-[44px] flex items-center justify-center ${
                  activeTab === 'calendar'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                Calendar Views
              </button>
            </div>

            {activeTab === 'calendar' && (
              <div className="bg-white rounded-xl shadow-lg border border-white/20 p-1">
                <button
                  onClick={() => setCalendarView('week')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    calendarView === 'week'
                      ? 'bg-green-500 text-white shadow-md'
                      : 'text-gray-600 hover:text-green-600'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setCalendarView('month')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    calendarView === 'month'
                      ? 'bg-green-500 text-white shadow-md'
                      : 'text-gray-600 hover:text-green-600'
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => setCalendarView('year')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    calendarView === 'year'
                      ? 'bg-green-500 text-white shadow-md'
                      : 'text-gray-600 hover:text-green-600'
                  }`}
                >
                  Year
                </button>
              </div>
            )}
          </div>

          {/* Weekly Timetable View */}
          {activeTab === 'timetable' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Weekly Timetable (8 AM - 6 PM)</span>
                  <button className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                    <Plus className="w-4 h-4" />
                    Add Event
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Workload Overview */}
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-3 text-sm sm:text-base">Weekly Workload Overview</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
                    {dayNamesLong.map((day, index) => {
                      const workload = getDayWorkload(index + 1)
                      return (
                        <div key={day} className="text-center">
                          <div className="font-medium text-gray-700 mb-1 text-xs sm:text-sm">
                            <span className="sm:hidden">{day.slice(0, 3)}</span>
                            <span className="hidden sm:inline">{day}</span>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getWorkloadColor(workload)}`}>
                            {workload.charAt(0).toUpperCase() + workload.slice(1)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {getEventsByDay(index + 1).length} events
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Timetable Grid */}
                <div className="overflow-x-auto">
                  <div className="min-w-[600px] sm:min-w-[800px]">
                    {/* Header Row */}
                    <div className="grid grid-cols-6 gap-1 sm:gap-2 mb-2">
                      <div className="p-1 sm:p-2 text-center font-semibold text-gray-600 text-xs sm:text-sm">Time</div>
                      {dayNames.map(day => (
                        <div key={day} className="p-1 sm:p-2 text-center font-semibold text-gray-600 bg-gray-50 rounded text-xs sm:text-sm">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Time Slots */}
                    {timeSlots.map(time => (
                      <div key={time} className="grid grid-cols-6 gap-1 sm:gap-2 mb-1">
                        <div className="p-1 sm:p-2 text-center text-xs sm:text-sm text-gray-500 font-medium border-r">
                          {time}
                        </div>
                        {dayNames.map((day, dayIndex) => {
                          const dayEvents = timetableEvents.filter(event => 
                            event.day === dayIndex + 1 && 
                            event.startTime <= time && 
                            event.endTime > time
                          )
                          
                          return (
                            <div key={`${day}-${time}`} className="p-0.5 sm:p-1 min-h-[30px] sm:min-h-[40px] border border-gray-100 rounded">
                              {dayEvents.map(event => (
                                <div
                                  key={event.id}
                                  className={`${event.color} text-white text-xs p-0.5 sm:p-1 rounded mb-1 shadow-sm`}
                                  title={`${event.title} - ${event.location}`}
                                >
                                  <div className="font-medium truncate text-xs">{event.title}</div>
                                  <div className="opacity-90 truncate text-xs hidden sm:block">{event.location}</div>
                                </div>
                              ))}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Calendar Views */}
          {activeTab === 'calendar' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Calendar - {calendarView.charAt(0).toUpperCase() + calendarView.slice(1)} View</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-medium px-3">
                      {currentDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                    </span>
                    <button
                      onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors ml-4">
                      <Plus className="w-4 h-4" />
                      Add Event
                    </button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {calendarView === 'week' && (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-7 gap-1 sm:gap-4">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center font-medium text-gray-600 p-1 sm:p-2 text-xs sm:text-sm">
                          <span className="sm:hidden">{day.slice(0, 1)}</span>
                          <span className="hidden sm:inline">{day}</span>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1 sm:gap-4">
                      {Array.from({ length: 7 }, (_, i) => {
                        const date = new Date()
                        date.setDate(date.getDate() - date.getDay() + i)
                        const dateStr = date.toISOString().split('T')[0]
                        const dayEvents = calendarEvents.filter(event => event.date === dateStr)
                        
                        return (
                          <div key={i} className="border border-gray-200 rounded-lg p-1 sm:p-2 min-h-[80px] sm:min-h-[120px]">
                            <div className="text-center font-medium text-gray-800 mb-1 sm:mb-2 text-xs sm:text-sm">
                              {date.getDate()}
                            </div>
                            <div className="space-y-1">
                              {dayEvents.slice(0, 2).map(event => (
                                <div
                                  key={event.id}
                                  className={`text-xs p-0.5 sm:p-1 rounded ${
                                    event.priority === 'high' ? 'bg-red-100 text-red-800' :
                                    event.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  <div className="font-medium truncate text-xs">{event.title}</div>
                                  <div className="truncate text-xs hidden sm:block">{event.startTime}</div>
                                </div>
                              ))}
                              {dayEvents.length > 2 && (
                                <div className="text-xs text-gray-500 text-center">+{dayEvents.length - 2} more</div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {calendarView === 'month' && (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-7 gap-1 sm:gap-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center font-medium text-gray-600 p-1 sm:p-2 text-xs sm:text-sm">
                          <span className="sm:hidden">{day.slice(0, 1)}</span>
                          <span className="hidden sm:inline">{day}</span>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1 sm:gap-2">
                      {Array.from({ length: 35 }, (_, i) => {
                        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
                        const date = new Date(monthStart)
                        date.setDate(date.getDate() + i - monthStart.getDay()) // Adjust for month start day
                        const dateStr = date.toISOString().split('T')[0]
                        const dayEvents = calendarEvents.filter(event => event.date === dateStr)
                        const isCurrentMonth = date.getMonth() === currentDate.getMonth()
                        
                        return (
                          <div key={i} className={`border border-gray-200 rounded p-1 min-h-[40px] sm:min-h-[60px] ${
                            !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
                          }`}>
                            <div className="text-xs font-medium mb-1">{date.getDate()}</div>
                            <div className="space-y-1">
                              {dayEvents.slice(0, 2).map(event => (
                                <div
                                  key={event.id}
                                  className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500"
                                  title={event.title}
                                ></div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {calendarView === 'year' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                    {Array.from({ length: 12 }, (_, monthIndex) => {
                      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                      return (
                        <div key={monthIndex} className="border border-gray-200 rounded-lg p-2 sm:p-3">
                          <div className="text-center font-medium text-gray-800 mb-2 text-sm">
                            {monthNames[monthIndex]} {currentDate.getFullYear()}
                          </div>
                          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 text-xs">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                              <div key={day} className="text-center text-gray-500 font-medium text-xs">
                                {day}
                              </div>
                            ))}
                            {Array.from({ length: 35 }, (_, dayIndex) => (
                              <div key={dayIndex} className="text-center p-0.5 sm:p-1 hover:bg-gray-100 rounded text-xs">
                                {dayIndex % 7 + 1}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Events List */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {calendarEvents.map(event => (
                  <div key={event.id} className="flex items-start gap-2 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full mt-1 flex-shrink-0 ${
                      event.priority === 'high' ? 'bg-red-500' :
                      event.priority === 'medium' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 text-sm sm:text-base">{event.title}</h4>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {event.date} • {event.startTime} - {event.endTime}
                      </p>
                      {event.description && (
                        <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2">{event.description}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        event.type === 'assignment' ? 'bg-orange-100 text-orange-800' :
                        event.type === 'exam' ? 'bg-red-100 text-red-800' :
                        event.type === 'study' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {event.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </main>
      </div>

      {/* Floating Durmah Voice Button - Now handled by DurmahWidget in _app.tsx */}
      {/*
      <div className="fixed bottom-6 right-6 z-40">
        <VoiceButton 
          variant="floating" 
          size="lg"
          showHeart={true}
          className="shadow-2xl hover:shadow-purple-500/50"
        />
      </div>
      */}
    </div>
  )
}