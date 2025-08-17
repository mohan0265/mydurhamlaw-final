import React, { useState } from 'react'
import { MonthData, CalendarEvent } from '@/types/calendar'
import { format, isSameDay, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar, Plus, Clock, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { DayDrawer } from './DayDrawer'

interface MonthViewProps {
  monthData: MonthData
  currentDate: Date
  onDateChange: (date: Date) => void
  onEventClick: (event: CalendarEvent) => void
  onDateClick: (date: string) => void
  onCreateEvent: (date: string) => void
}

export const MonthView: React.FC<MonthViewProps> = ({
  monthData,
  currentDate,
  onDateChange,
  onEventClick,
  onDateClick,
  onCreateEvent
}) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [isDayDrawerOpen, setIsDayDrawerOpen] = useState(false)

  const today = new Date()
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)

  const handlePrevMonth = () => {
    onDateChange(subMonths(currentDate, 1))
  }

  const handleNextMonth = () => {
    onDateChange(addMonths(currentDate, 1))
  }

  const handleTodayClick = () => {
    onDateChange(new Date())
  }

  const handleDateClick = (date: string) => {
    setSelectedDate(date)
    setIsDayDrawerOpen(true)
    onDateClick(date)
  }

  const getEventsByType = (events: CalendarEvent[]) => {
    const grouped: { [key: string]: CalendarEvent[] } = {}
    events.forEach(event => {
      if (!grouped[event.type]) grouped[event.type] = []
      grouped[event.type]!.push(event)
    })
    return grouped
  }

  const getEventTypeColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'lecture': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'seminar': return 'bg-green-100 text-green-800 border-green-200'
      case 'tutorial': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'exam': return 'bg-red-100 text-red-800 border-red-200'
      case 'assessment': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'personal': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const renderEventPreview = (event: CalendarEvent, isOverflow = false) => (
    <div
      key={event.id}
      onClick={(e) => {
        e.stopPropagation()
        onEventClick(event)
      }}
      className={`text-xs p-1.5 rounded-md cursor-pointer hover:shadow-sm transition-all duration-200 border ${getEventTypeColor(event.type)} ${
        isOverflow ? 'mb-1' : 'mb-1'
      }`}
      title={`${event.title} - ${format(new Date(event.start_at), 'h:mm a')}`}
    >
      <div className="font-medium truncate">{event.title}</div>
      <div className="flex items-center space-x-1 mt-0.5 text-xs opacity-75">
        <Clock className="w-3 h-3" />
        <span>{format(new Date(event.start_at), 'h:mm a')}</span>
        {event.location && (
          <>
            <MapPin className="w-3 h-3 ml-1" />
            <span className="truncate">{event.location}</span>
          </>
        )}
      </div>
    </div>
  )

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleTodayClick}
              variant="outline"
              size="sm"
              className="text-white border-white/30 hover:bg-white/10"
            >
              Today
            </Button>
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="font-semibold">
              {monthData?.weeks?.reduce((acc, week) => {
                if (!week?.days) return acc
                return acc + week.days.filter(day => day?.has_lecture).length
              }, 0) || 0}
            </div>
            <div className="text-purple-200">Lectures</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="font-semibold">
              {monthData?.weeks?.reduce((acc, week) => {
                if (!week?.days) return acc
                return acc + week.days.filter(day => day?.has_exam || day?.has_assessment).length
              }, 0) || 0}
            </div>
            <div className="text-purple-200">Deadlines</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="font-semibold">
              {monthData?.weeks?.reduce((acc, week) => {
                if (!week?.days) return acc
                return acc + week.days.filter(day => day?.events?.some(e => e?.type === 'personal')).length
              }, 0) || 0}
            </div>
            <div className="text-purple-200">Personal</div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-px mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="p-3 text-center text-sm font-semibold text-gray-600">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Cells */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {monthData?.weeks?.map((week, weekIndex) =>
            week?.days?.map((day, dayIndex) => {
              if (!day) return null
              const isToday = isSameDay(new Date(day.date || new Date()), today)
              const hasEvents = (day.events?.length || 0) > 0
              const visibleEvents = (day.events || []).slice(0, 3)
              const overflowCount = (day.events?.length || 0) - visibleEvents.length

              return (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  onClick={() => day?.date && handleDateClick(day.date)}
                  className={`min-h-[120px] p-2 bg-white cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                    !(day?.is_current_month) ? 'text-gray-400 bg-gray-50' : ''
                  } ${isToday ? 'bg-blue-50 border-2 border-blue-300' : 'border-r border-b border-gray-200'}`}
                >
                  {/* Date Number */}
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${
                      isToday ? 'text-blue-600 font-bold' : 
                      !(day?.is_current_month) ? 'text-gray-400' : 'text-gray-900'
                    }`}>
                      {day?.date ? format(new Date(day.date), 'd') : ''}
                    </span>

                    {/* Status Indicators */}
                    <div className="flex space-x-1">
                      {day?.has_exam && (
                        <div className="w-2 h-2 bg-red-500 rounded-full" title="Exam" />
                      )}
                      {day?.has_assessment && (
                        <div className="w-2 h-2 bg-orange-500 rounded-full" title="Assessment Due" />
                      )}
                      {day?.has_lecture && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" title="Lecture" />
                      )}
                    </div>
                  </div>

                  {/* Events */}
                  <div className="space-y-1">
                    {visibleEvents.map(event => renderEventPreview(event))}
                    
                    {overflowCount > 0 && (
                      <div className="text-xs text-gray-500 font-medium py-1">
                        +{overflowCount} more
                      </div>
                    )}
                  </div>

                  {/* Add Event Button (on hover) */}
                  {day?.is_current_month && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (day?.date) onCreateEvent(day.date)
                      }}
                      className="absolute bottom-2 right-2 w-5 h-5 bg-gray-300 hover:bg-purple-500 text-gray-600 hover:text-white rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-200 group-hover:opacity-100"
                      title="Add event"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )
            }) || []
          ) || []}
        </div>
      </div>

      {/* Day Details Drawer */}
      <DayDrawer
        isOpen={isDayDrawerOpen}
        onClose={() => setIsDayDrawerOpen(false)}
        date={selectedDate}
        onEventClick={onEventClick}
        onCreateEvent={onCreateEvent}
      />
    </div>
  )
}