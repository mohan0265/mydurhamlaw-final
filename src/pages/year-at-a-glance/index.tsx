import React, { useState, useContext } from 'react'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { AuthContext } from '@/lib/supabase/AuthContext'
import { useCalendarData, useCalendarFilter, useAcademicCalendar } from '@/lib/hooks/useCalendarData'
import { YearView } from '@/components/calendar/YearView'
import { CalendarViewMode } from '@/types/calendar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ChevronDown, Eye, Calendar, Clock, Settings, Filter } from 'lucide-react'
import { DURHAM_LLB_2025_26, getDefaultPlanByStudentYear } from '@/data/durham/llb'
import toast from 'react-hot-toast'

const YearAtAGlancePage = () => {
  const { session, userProfile } = useContext(AuthContext)
  const [currentAcademicYear, setCurrentAcademicYear] = useState('2025/26')
  const [viewMode, setViewMode] = useState<CalendarViewMode>('year')
  const [showFilters, setShowFilters] = useState(false)

  // Get user info and map to Durham data structure
  const userId = session?.user?.id
  const programme = userProfile?.user_type || 'LLB'
  const userYearGroup = userProfile?.year_group || 'year1'
  const normalizedYearGroup = userYearGroup.toLowerCase().replace(/\s/g, '') as 'foundation' | 'year1' | 'year2' | 'year3'
  
  // Get the Durham plan for the user's year
  const userPlan = getDefaultPlanByStudentYear(normalizedYearGroup)
  const yearOfStudy = userPlan ? 
    (userPlan.yearKey === 'foundation' ? 0 : parseInt(userPlan.yearKey.replace('year', ''))) : 1

  // Calendar hooks
  const {
    yearOverview,
    multiYearData,
    moduleProgress,
    yearLoading,
    multiYearLoading,
    yearError,
    multiYearError
  } = useCalendarData({
    userId: userId || '',
    programme,
    yearOfStudy,
    academicYear: currentAcademicYear
  })

  const { filter, updateFilter, resetFilter } = useCalendarFilter()
  const { currentTerm, isInTerm } = useAcademicCalendar(currentAcademicYear)

  const handleModuleClick = (moduleId: string) => {
    toast.success('Module details coming soon!')
    // TODO: Navigate to module detail page or open module drawer
  }

  const handleEventClick = (eventId: string) => {
    toast.success('Event details coming soon!')
    // TODO: Open event detail modal
  }

  const getViewModeOptions = () => [
    { value: 'year', label: 'Year View', icon: Calendar, href: '/year-at-a-glance' },
    { value: 'month', label: 'Month View', icon: Calendar, href: '/year-at-a-glance/month' },
    { value: 'week', label: 'Week View', icon: Clock, href: '/year-at-a-glance/week' }
  ]

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-600 mb-4">
            Please sign in to access your Year at a Glance calendar.
          </p>
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
        </Card>
      </div>
    )
  }

  if (yearLoading || multiYearLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your academic year overview...</p>
        </div>
      </div>
    )
  }

  if (yearError || multiYearError) {
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
        <title>My Year at a Glance - MyDurhamLaw</title>
        <meta name="description" content="Your complete academic year overview with modules, deadlines, and progress tracking." />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Title and Academic Year */}
              <div className="flex items-center space-x-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">My Year at a Glance</h1>
                  <p className="text-sm text-gray-600">
                    {programme} Year {yearOfStudy} • {currentAcademicYear}
                  </p>
                </div>

                {/* Academic Year Selector */}
                <div className="relative">
                  <select
                    value={currentAcademicYear}
                    onChange={(e) => setCurrentAcademicYear(e.target.value)}
                    className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="2024/25">2024/25</option>
                    <option value="2025/26">2025/26</option>
                    <option value="2026/27">2026/27</option>
                  </select>
                </div>

                {/* Current Term Badge */}
                {isInTerm && (
                  <Badge variant="secondary" size="lg" className="bg-green-100 text-green-800">
                    Term {currentTerm} Active
                  </Badge>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-3">
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
                                : filter.event_types.filter(t => t !== type)
                              updateFilter({ event_types: types })
                            }}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-600 capitalize">{type}</span>
                        </label>
                      ))}
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {moduleProgress ? (
            <YearView
              yearOverview={yearOverview}
              multiYearData={multiYearData}
              moduleProgress={moduleProgress}
              userYearOfStudy={yearOfStudy}
              onModuleClick={handleModuleClick}
              onEventClick={handleEventClick}
            />
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
              <p className="text-gray-600">
                Unable to load your academic year data. Please try refreshing the page.
              </p>
            </div>
          )}
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

export default YearAtAGlancePage