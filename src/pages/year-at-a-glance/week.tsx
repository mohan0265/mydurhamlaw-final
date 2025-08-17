import React, { useState, useContext, useCallback } from 'react'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { AuthContext } from '@/lib/supabase/AuthContext'
import { useCalendarData, useCalendarFilter } from '@/lib/hooks/useCalendarData'
import { WeekView } from '@/components/calendar/WeekView'
import { CalendarViewMode } from '@/types/calendar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ChevronDown, Calendar, Clock, Settings, Filter, Plus, Timer, Target } from 'lucide-react'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import toast from 'react-hot-toast'

const WeekViewPage = () => {
  const { session, userProfile } = useContext(AuthContext)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode] = useState<CalendarViewMode>('week')
  const [showFilters, setShowFilters] = useState(false)
  const [pomodoroActive, setPomodoroActive] = useState(false)
  const [weeklyGoal, setWeeklyGoal] = useState(25) // hours

  // Get user info
  const userId = session?.user?.id
  const programme = userProfile?.user_type || 'LLB'
  const yearOfStudy = userProfile?.year_group ? parseInt(userProfile.year_group.replace('year', '')) : 1

  // Calendar hooks
  const {
    useWeekData
  } = useCalendarData({
    userId: userId || '',
    programme,
    yearOfStudy
  })

  const {
    data: weekData,
    isLoading: weekLoading,
    error: weekError
  } = useWeekData(currentDate)

  const { filter, updateFilter, resetFilter } = useCalendarFilter()

  const handleDateChange = (date: Date) => {
    setCurrentDate(date)
  }

  const handleEventClick = useCallback((event: any) => {
    toast.success(`Opening ${event.title}`)
    // TODO: Open event detail modal
  }, [])

  const handleCreateEvent = useCallback((startTime: string, endTime: string) => {
    toast.success('Creating new study block...')
    // TODO: Open event creation modal with pre-filled times
  }, [])

  const handleUpdateEvent = useCallback((eventId: string, updates: any) => {
    toast.success('Event updated!')
    // TODO: Update event via API
  }, [])

  const startPomodoro = () => {
    setPomodoroActive(true)
    toast.success('Pomodoro timer started! 🍅')
    // TODO: Implement actual pomodoro timer
    setTimeout(() => {
      setPomodoroActive(false)
      toast.success('Pomodoro complete! Take a break.')
    }, 25 * 60 * 1000) // 25 minutes
  }

  const calculateWeeklyStudyTime = () => {
    if (!weekData) return 0
    return weekData.personal_items
      .filter((item: any) => item.type === 'study')
      .reduce((total: number, item: any) => {
        const duration = item.end_at ? 
          Math.abs(new Date(item.end_at).getTime() - new Date(item.start_at).getTime()) / (1000 * 60 * 60) : 1
        return total + duration
      }, 0)
  }

  const getViewModeOptions = () => [
    { value: 'year', label: 'Year View', icon: Calendar, href: '/year-at-a-glance' },
    { value: 'month', label: 'Month View', icon: Calendar, href: '/year-at-a-glance/month' },
    { value: 'week', label: 'Week View', icon: Clock, href: '/year-at-a-glance/week' }
  ]

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
  const studyHours = calculateWeeklyStudyTime()
  const goalProgress = Math.min((studyHours / weeklyGoal) * 100, 100)

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-600 mb-4">
            Please sign in to access your weekly calendar view.
          </p>
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
        </Card>
      </div>
    )
  }

  if (weekLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your weekly schedule...</p>
        </div>
      </div>
    )
  }

  if (weekError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Calendar</h2>
          <p className="text-gray-600 mb-4">
            There was an issue loading your calendar data. Please try again.
          </p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Week View - My Year at a Glance - MyDurhamLaw</title>
        <meta name="description" content="Weekly calendar view with hourly scheduling, study blocks, and productivity tools." />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Title */}
              <div className="flex items-center space-x-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Week View</h1>
                  <p className="text-sm text-gray-600">
                    {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')} • Detailed Weekly Planning
                  </p>
                </div>

                {/* Weekly Goal Progress */}
                <div className="hidden md:flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-gray-600">Weekly Goal:</span>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${goalProgress}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {Math.round(studyHours)}/{weeklyGoal}h
                    </span>
                  </div>
                  
                  {goalProgress >= 100 && (
                    <Badge variant="success" size="sm">
                      Goal Achieved! 🎉
                    </Badge>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-3">
                {/* Pomodoro Timer */}
                <Button
                  onClick={startPomodoro}
                  variant={pomodoroActive ? "secondary" : "outline"}
                  size="sm"
                  className="flex items-center space-x-2"
                  disabled={pomodoroActive}
                >
                  <Timer className="w-4 h-4" />
                  <span>{pomodoroActive ? 'Active' : 'Pomodoro'}</span>
                  {pomodoroActive && <span>🍅</span>}
                </Button>

                {/* Add Study Block */}
                <Button
                  onClick={() => handleCreateEvent(
                    new Date().toISOString(),
                    new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
                  )}
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Study Block</span>
                </Button>

                {/* Filter Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2"
                >
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
                </Button>

                {/* View Mode Switcher */}
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  {getViewModeOptions().map((option) => (
                    <Link key={option.value} href={option.href}>
                      <button
                        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                          option.value === viewMode
                            ? 'bg-white text-purple-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <option.icon className="w-4 h-4" />
                        <span>{option.label}</span>
                      </button>
                    </Link>
                  ))}
                </div>

                {/* Settings */}
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="border-t border-gray-200 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <span className="text-sm font-medium text-gray-700">Show:</span>
                    
                    {/* Event Type Filters */}
                    <div className="flex items-center space-x-3">
                      {['lectures', 'assessments', 'exams', 'personal'].map((type) => (
                        <label key={type} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={filter.event_types.includes(type as any)}
                            onChange={(e) => {
                              const types = e.target.checked
                                ? [...filter.event_types, type as any]
                                : filter.event_types.filter(t => t !== type)
                              updateFilter({ event_types: types })
                            }}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-600 capitalize">{type}</span>
                        </label>
                      ))}
                    </div>

                    {/* Time Range Filter */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Hours:</span>
                      <select 
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                        defaultValue="7-21"
                      >
                        <option value="6-22">6 AM - 10 PM</option>
                        <option value="7-21">7 AM - 9 PM</option>
                        <option value="8-20">8 AM - 8 PM</option>
                        <option value="9-18">9 AM - 6 PM</option>
                      </select>
                    </div>

                    {/* Weekly Goal Adjuster */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Weekly Goal:</span>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={weeklyGoal}
                        onChange={(e) => setWeeklyGoal(parseInt(e.target.value))}
                        className="w-16 text-sm border border-gray-300 rounded px-2 py-1"
                      />
                      <span className="text-sm text-gray-600">hours</span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilter}
                    className="text-sm"
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {weekData ? (
            <WeekView
              weekData={weekData}
              currentDate={currentDate}
              onDateChange={handleDateChange}
              onEventClick={handleEventClick}
              onCreateEvent={handleCreateEvent}
              onUpdateEvent={handleUpdateEvent}
            />
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
              <p className="text-gray-600 mb-4">
                Unable to load your weekly schedule data. Please try refreshing the page.
              </p>
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          )}
        </div>

        {/* Floating Study Tools */}
        <div className="fixed bottom-6 left-6 z-30">
          <Card className="p-4 bg-white/95 backdrop-blur-sm shadow-lg">
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-900">Study Tools</div>
              
              <div className="flex items-center space-x-2">
                <Button
                  onClick={startPomodoro}
                  variant={pomodoroActive ? "secondary" : "outline"}
                  size="sm"
                  disabled={pomodoroActive}
                >
                  <Timer className="w-4 h-4 mr-1" />
                  {pomodoroActive ? '25:00' : 'Start'}
                </Button>
                
                <div className="text-xs text-gray-600">
                  {studyHours.toFixed(1)}h this week
                </div>
              </div>

              {pomodoroActive && (
                <div className="w-full bg-red-200 rounded-full h-2">
                  <div className="bg-red-600 h-2 rounded-full w-1/4 animate-pulse" />
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Keyboard Shortcuts Help */}
        <div className="fixed bottom-4 right-4 z-30">
          <Card className="p-3 text-xs text-gray-600 bg-white/95 backdrop-blur-sm">
            <div className="space-y-1">
              <div><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">←/→</kbd> Change week</div>
              <div><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">T</kbd> Go to today</div>
              <div><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">N</kbd> New study block</div>
              <div><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">P</kbd> Start pomodoro</div>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // You can add server-side authentication and data prefetching here
  return {
    props: {}
  }
}

export default WeekViewPage