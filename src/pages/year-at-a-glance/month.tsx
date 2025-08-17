// src/pages/year-at-a-glance/month.tsx
import React, { useContext, useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { AuthContext } from '@/lib/supabase/AuthContext'
import { useCalendarData, useCalendarFilter } from '@/lib/hooks/useCalendarData'
import { MonthView } from '@/components/calendar/MonthView'
import { CalendarViewMode } from '@/types/calendar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Settings,
  Filter,
  Plus,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useCalendarCtx } from '@/context/CalendarContext'

const MonthViewPage = () => {
  const auth = useContext(AuthContext)
  const { session, userProfile } = auth || { session: null, userProfile: null }

  // Shared calendar state (provided by CalendarProvider in LayoutShell)
  const {
    anchorDate,
    setAnchorDate,
    nextMonth,
    prevMonth,
  } = useCalendarCtx()

  const [viewMode] = useState<CalendarViewMode>('month')
  const [showFilters, setShowFilters] = useState(false)

  // User/programme
  const userId = session?.user?.id || ''
  const programme = userProfile?.user_type || 'LLB'
  const yearOfStudy =
    userProfile?.year_group
      ? parseInt(userProfile.year_group.replace('year', ''), 10) || 1
      : 1

  // Calendar data hooks
  const { useMonthData } = useCalendarData({
    userId,
    programme,
    yearOfStudy,
  })

  const {
    data: monthData,
    isLoading: monthLoading,
    error: monthError,
  } = useMonthData(anchorDate.getFullYear(), anchorDate.getMonth() + 1)

  // Filters
  const { filter, updateFilter, resetFilter } =
    useCalendarFilter() || {
      filter: { event_types: [], show_completed: false },
      updateFilter: () => {},
      resetFilter: () => {},
    }

  // Handlers
  const handleDateChange = (date: Date) => {
    // MonthView will call this when user navigates inside the component
    setAnchorDate(date)
  }

  const handleEventClick = (event: any) => {
    toast.success('Event details coming soon!')
  }

  const handleDateClick = (isoDate: string) => {
    // Hook up a day drawer or route to week/day later
    // For now we no-op
  }

  const handleCreateEvent = (isoDate?: string) => {
    toast.success('Event creation coming soon!')
  }

  const getViewModeOptions = () => [
    { value: 'year', label: 'Year View', icon: Calendar, href: '/year-at-a-glance' },
    { value: 'month', label: 'Month View', icon: Calendar, href: '/year-at-a-glance/month' },
    { value: 'week', label: 'Week View', icon: Clock, href: '/year-at-a-glance/week' },
  ]

  // Keyboard shortcuts: ←/→, T (today), N (new event)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevMonth()
      if (e.key === 'ArrowRight') nextMonth()
      if (e.key.toLowerCase() === 't') setAnchorDate(new Date())
      if (e.key.toLowerCase() === 'n') handleCreateEvent()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [nextMonth, prevMonth, setAnchorDate])

  // Auth gate
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-600 mb-4">
            Please sign in to access your monthly calendar view.
          </p>
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
        </Card>
      </div>
    )
  }

  // Loading / error
  if (monthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your monthly calendar...</p>
        </div>
      </div>
    )
  }

  if (monthError) {
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
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Card>
      </div>
    )
  }

  // Header labels
  const monthLabel = anchorDate.toLocaleString('en-GB', { month: 'long', year: 'numeric' })

  return (
    <>
      <Head>
        <title>Month View - My Year at a Glance - MyDurhamLaw</title>
        <meta
          name="description"
          content="Monthly calendar view with detailed daily scheduling and event management."
        />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Sticky header under the global header */}
        <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Title & current month */}
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={prevMonth} aria-label="Previous month">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="min-w-[10rem] text-center">
                  <h1 className="text-2xl font-bold text-gray-900">{monthLabel}</h1>
                  <p className="text-sm text-gray-600">
                    {programme} Year {yearOfStudy} • Detailed Monthly Planning
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={nextMonth} aria-label="Next month">
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setAnchorDate(new Date())}>
                  Today
                </Button>
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-3">
                {/* Add Event */}
                <Button
                  onClick={() =>
                    handleCreateEvent(new Date().toISOString().split('T')[0] ||
                      new Date().toLocaleDateString('en-CA'))
                  }
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Event</span>
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
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      showFilters ? 'rotate-180' : ''
                    }`}
                  />
                </Button>

                {/* View switcher */}
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

                {/* Settings placeholder */}
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="border-t border-gray-200 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-700">Show:</span>

                    {/* Event Type Filters */}
                    <div className="flex items-center space-x-2">
                      {['lectures', 'assessments', 'exams', 'personal'].map((type) => (
                        <label key={type} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={filter.event_types.includes(type as any)}
                            onChange={(e) => {
                              const types = e.target.checked
                                ? [...filter.event_types, type as any]
                                : filter.event_types.filter((t) => t !== type)
                              updateFilter({ event_types: types })
                            }}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-600 capitalize">{type}</span>
                        </label>
                      ))}
                    </div>

                    {/* Show Completed Toggle */}
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filter.show_completed}
                        onChange={(e) => updateFilter({ show_completed: e.target.checked })}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-600">Show Completed</span>
                    </label>
                  </div>

                  <Button variant="ghost" size="sm" onClick={resetFilter} className="text-sm">
                    Reset Filters
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {monthData ? (
            <MonthView
              monthData={monthData}
              currentDate={anchorDate}
              onDateChange={handleDateChange}
              onEventClick={handleEventClick}
              onDateClick={handleDateClick}
              onCreateEvent={handleCreateEvent}
            />
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
              <p className="text-gray-600 mb-4">
                Unable to load your monthly calendar data. Please try refreshing the page.
              </p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          )}
        </div>

        {/* Keyboard Shortcuts Help */}
        <div className="fixed bottom-4 right-4 z-30">
          <Card className="p-3 text-xs text-gray-600 bg-white/95 backdrop-blur-sm">
            <div className="space-y-1">
              <div>
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">←/→</kbd> Change month
              </div>
              <div>
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">T</kbd> Go to today
              </div>
              <div>
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">N</kbd> New event
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}

export default MonthViewPage
