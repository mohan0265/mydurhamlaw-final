import React from 'react'
import { CalendarEvent, DayDetail } from '@/types/calendar'
import { format } from 'date-fns'
import { X, Plus, Calendar, Clock, MapPin, Book, AlertCircle, User, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'

interface DayDrawerProps {
  isOpen: boolean
  onClose: () => void
  date: string | null
  onEventClick: (event: CalendarEvent) => void
  onCreateEvent: (date: string) => void
  dayDetail?: DayDetail
}

export const DayDrawer: React.FC<DayDrawerProps> = ({
  isOpen,
  onClose,
  date,
  onEventClick,
  onCreateEvent,
  dayDetail
}) => {
  if (!isOpen || !date) return null

  const dateObj = new Date(date)
  const isToday = format(new Date(), 'yyyy-MM-dd') === date

  const getEventIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'lecture': return <Book className="w-4 h-4 text-blue-600" />
      case 'seminar': return <User className="w-4 h-4 text-green-600" />
      case 'tutorial': return <User className="w-4 h-4 text-purple-600" />
      case 'exam': return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'assessment': return <AlertCircle className="w-4 h-4 text-orange-600" />
      case 'personal': return <User className="w-4 h-4 text-gray-600" />
      default: return <Calendar className="w-4 h-4 text-gray-600" />
    }
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

  const renderEvent = (event: CalendarEvent) => (
    <div
      key={event.id}
      onClick={() => onEventClick(event)}
      className={`p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-all duration-200 ${getEventTypeColor(event.type)}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          {getEventIcon(event.type)}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm">{event.title}</h4>
            <div className="flex items-center space-x-2 mt-1 text-xs opacity-75">
              <Clock className="w-3 h-3" />
              <span>
                {format(new Date(event.start_at), 'h:mm a')}
                {event.end_at && ` - ${format(new Date(event.end_at), 'h:mm a')}`}
              </span>
              {event.location && (
                <>
                  <MapPin className="w-3 h-3" />
                  <span>{event.location}</span>
                </>
              )}
            </div>
            {event.description && (
              <p className="text-xs mt-2 text-gray-600 line-clamp-2">
                {event.description}
              </p>
            )}
            {(event as any)?.meta?.kind === "exam-window" && (
              <div className="mt-2 text-sm opacity-80">
                This module's exam takes place during the official assessment window{" "}
                <strong>{(event as any).meta.window?.start}</strong> -{" "}
                <strong>{(event as any).meta.window?.end}</strong>. Exact sitting date/time is set by
                the Law School and may be released later. This entry is shown per day to keep you revision-aware.
              </div>
            )}
          </div>
        </div>
        <Badge size="sm" variant="secondary">
          {event.type}
        </Badge>
      </div>
    </div>
  )

  const mockDayDetail: DayDetail = dayDetail || {
    date,
    day_name: format(dateObj, 'EEEE'),
    is_today: isToday,
    events: [],
    assessments_due: [],
    exams: [],
    personal_items: [],
    study_time_blocks: []
  }

  const allEvents = [
    ...mockDayDetail.events,
    ...mockDayDetail.assessments_due.map(a => ({
      ...a,
      type: 'assessment' as const,
      start_at: a.due_at,
      end_at: a.due_at,
      is_university_fixed: true,
      is_all_day: false
    })),
    ...mockDayDetail.exams.map(e => ({
      ...e,
      type: 'exam' as const,
      start_at: e.date,
      end_at: e.date,
      is_university_fixed: true,
      is_all_day: e.start_time ? false : true
    }))
  ].sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  {format(dateObj, 'EEEE, MMMM d')}
                </h2>
                <p className="text-purple-200 text-sm">
                  {format(dateObj, 'yyyy')}
                  {isToday && ' • Today'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="text-center">
                <div className="text-lg font-bold">
                  {mockDayDetail.events.length}
                </div>
                <div className="text-xs text-purple-200">Events</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">
                  {mockDayDetail.assessments_due.length + mockDayDetail.exams.length}
                </div>
                <div className="text-xs text-purple-200">Deadlines</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">
                  {mockDayDetail.personal_items.length}
                </div>
                <div className="text-xs text-purple-200">Personal</div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Add Event Button */}
            <Button
              onClick={() => onCreateEvent(date)}
              className="w-full flex items-center justify-center space-x-2"
              size="lg"
            >
              <Plus className="w-4 h-4" />
              <span>Add Event</span>
            </Button>

            {/* Events */}
            {allEvents.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Schedule ({allEvents.length})
                </h3>
                <div className="space-y-3">
                  {allEvents.map(renderEvent)}
                </div>
              </div>
            ) : (
              <Card className="p-6 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Scheduled</h3>
                <p className="text-gray-600 text-sm mb-4">
                  This day is free for you to plan your studies or personal activities.
                </p>
                <Button
                  onClick={() => onCreateEvent(date)}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Something
                </Button>
              </Card>
            )}

            {/* Study Time Blocks */}
            {mockDayDetail.study_time_blocks.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Book className="w-5 h-5 mr-2" />
                  Study Blocks
                </h3>
                <div className="space-y-2">
                  {mockDayDetail.study_time_blocks.map((block, index) => (
                    <div key={index} className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-indigo-900">{block.title}</h4>
                        <span className="text-sm text-indigo-700">
                          {block.start_time} - {block.end_time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Personal Items */}
            {mockDayDetail.personal_items.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Personal Tasks
                </h3>
                <div className="space-y-2">
                  {mockDayDetail.personal_items.map((item) => (
                    <div key={item.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {item.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <div className="w-4 h-4 border-2 border-gray-300 rounded" />
                          )}
                          <span className={`font-medium ${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {item.title}
                          </span>
                        </div>
                        <Badge size="sm" variant="secondary">
                          {item.type}
                        </Badge>
                      </div>
                      {item.notes && (
                        <p className="text-sm text-gray-600 mt-2 ml-6">{item.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Motivational Section */}
            {isToday && (
              <Card className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <div>
                    <h4 className="font-medium text-green-800">Today&apos;s Focus</h4>
                    <p className="text-sm text-green-700">
                      You&apos;ve got this! Make today count towards your academic goals.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}