// src/pages/year-at-a-glance/week.tsx
import React, { useState, useContext } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { AuthContext } from '@/lib/supabase/AuthContext'
import { useCalendarData } from '@/lib/hooks/useCalendarData'
import { WeekView } from '@/components/calendar/WeekView'
import { Button } from '@/components/ui/Button'

const WeekPage: React.FC = () => {
  const { session } = useContext(AuthContext)
  const userId = session?.user?.id || ''
  const [currentDate, setCurrentDate] = useState<Date>(new Date())

  // calendar hooks
  const { useWeekData, termDates } = useCalendarData({ userId })
  const { data: weekData, isLoading, error } = useWeekData(currentDate)

  const handleEventClick = () => {
    // TODO: open event detail drawer
  }

  const handleCreate = () => {
    // TODO: open create dialog
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Sign In Required</h2>
          <p className="text-gray-600 mb-4">Please sign in to access Week View.</p>
          <Link href="/login"><Button>Sign In</Button></Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Week View – MyDurhamLaw</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Top bar */}
        <div className="bg-white border-b sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <h1 className="text-xl font-bold">Week View</h1>
            <div className="space-x-2">
              <Link href="/year-at-a-glance">
                <Button variant="outline">Year View</Button>
              </Link>
              <Link href="/year-at-a-glance/month">
                <Button variant="outline">Month View</Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {isLoading && <div className="text-gray-600 py-24 text-center">Loading week…</div>}
          {error && (
            <div className="text-red-600 py-24 text-center">
              Unable to load this week. Please try again.
            </div>
          )}

          {weekData && (
            <WeekView
              weekData={weekData as any}
              currentWeekDate={currentDate}
              onWeekChange={setCurrentDate}
              onEventClick={handleEventClick as any}
              onCreateEvent={handleCreate as any}
              termStartDate={termDates?.term1?.start || '2025-10-06'}
            />
          )}
        </div>
      </div>
    </>
  )
}

export default WeekPage
