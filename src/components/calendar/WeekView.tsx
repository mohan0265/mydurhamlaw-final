import React from 'react'
import { addWeeks, subWeeks, format, startOfWeek, endOfWeek, isSameDay } from 'date-fns'
import { ChevronLeft, ChevronRight, Clock, MapPin, Info } from 'lucide-react'
import { Button } from '@/components/ui/Button'

type EventType =
  | 'lecture'
  | 'seminar'
  | 'tutorial'
  | 'exam'
  | 'assessment'
  | 'personal'

type WeekViewEvent = {
  id: string
  title: string
  start_at: string // ISO
  end_at: string   // ISO
  type: EventType
  location?: string
  module_title?: string
}

type WeekViewDay = {
  date: string // ISO yyyy-MM-dd
  events?: WeekViewEvent[]
  has_exam?: boolean
  has_assessment?: boolean
  has_lecture?: boolean
}

type WeekDataLocal = {
  days?: WeekViewDay[]
}

type WeekViewProps = {
  weekData: WeekDataLocal
  currentWeekDate: Date
  onWeekChange: (date: Date) => void
  onEventClick: (event: WeekViewEvent) => void
  onCreateEvent: (dateISO: string) => void
  termStartDate?: string // default Michaelmas start
}

function colorByType(type: EventType) {
  switch (type) {
    case 'lecture': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'seminar': return 'bg-green-100 text-green-800 border-green-200'
    case 'tutorial': return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'exam': return 'bg-red-100 text-red-800 border-red-200'
    case 'assessment': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'personal':
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export const WeekView: React.FC<WeekViewProps> = ({
  weekData,
  currentWeekDate,
  onWeekChange,
  onEventClick,
  onCreateEvent,
  termStartDate = '2025-10-06',
}) => {
  const weekStart = startOfWeek(currentWeekDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentWeekDate, { weekStartsOn: 1 })
  const termStart = new Date(termStartDate)
  const isVacationWeek = weekStart < termStart

  const handlePrev = () => onWeekChange(subWeeks(currentWeekDate, 1))
  const handleNext = () => onWeekChange(addWeeks(currentWeekDate, 1))
  const handleToday = () => onWeekChange(new Date())

  const count = (kind: 'classes' | 'deadlines') =>
    (weekData?.days || []).reduce((acc, d) => {
      if (!d?.date) return acc
      const dt = new Date(d.date)
      if (dt < termStart) return acc
      const events = d.events || []
      if (kind === 'classes') {
        return acc + events.filter(e => e.type === 'lecture' || e.type === 'seminar' || e.type === 'tutorial').length
      }
      if (kind === 'deadlines') {
        return acc + events.filter(e => e.type === 'assessment' || e.type === 'exam').length
      }
      return acc
    }, 0)

  const renderDay = (day?: WeekViewDay) => {
    if (!day) return null
    const dateObj = new Date(day.date)
    const today = new Date()
    const isToday = isSameDay(dateObj, today)

    // Pre-term / vacation day
    if (dateObj < termStart) {
      return (
        <div key={day.date} className="min-h-[560px] bg-gray-50 border-l border-gray-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-400">{format(dateObj, 'd MMM')}</div>
            <span className="text-[11px] text-gray-400">Vacation</span>
          </div>
          <div className="text-xs text-gray-400 italic">No scheduled teaching</div>
        </div>
      )
    }

    return (
      <div key={day.date} className="min-h-[560px] bg-white border-l border-gray-200 p-3">
        {/* header */}
        <div className="flex items-center justify-between mb-2">
          <div className={`text-sm font-semibold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
            {format(dateObj, 'EEE dd MMM')}
          </div>
          <div className="flex space-x-1">
            {day?.has_exam && <div className="w-2 h-2 bg-red-500 rounded-full" title="Exam" />}
            {day?.has_assessment && <div className="w-2 h-2 bg-orange-500 rounded-full" title="Assessment Due" />}
            {day?.has_lecture && <div className="w-2 h-2 bg-blue-500 rounded-full" title="Lecture" />}
          </div>
        </div>

        {/* events */}
        <div className="space-y-2">
          {(day.events || []).map(evt => (
            <div
              key={evt.id}
              className={`p-3 rounded-md border cursor-pointer transition ${colorByType(evt.type)} hover:shadow`}
              onClick={() => onEventClick(evt)}
            >
              <div className="font-medium">{evt.title}</div>
              <div className="text-xs mt-1 opacity-80 flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span>
                  {format(new Date(evt.start_at), 'HH:mm')}–{format(new Date(evt.end_at), 'HH:mm')}
                </span>
                {evt.location && (
                  <>
                    <span>•</span>
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{evt.location}</span>
                  </>
                )}
              </div>
              {evt.module_title && (
                <div className="text-xs mt-1 opacity-80">{evt.module_title}</div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-3">
          <Button size="sm" variant="outline" onClick={() => onCreateEvent(day.date)} className="w-full">
            + Add Study Block / Personal
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              {format(weekStart, 'dd MMM')} – {format(weekEnd, 'dd MMM, yyyy')}
            </h2>
            <div className="text-purple-100 text-sm">
              {count('classes')} classes • {count('deadlines')} deadlines
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleToday} variant="outline" size="sm" className="text-white border-white/30 hover:bg-white/10">Today</Button>
            <button onClick={handlePrev} className="p-2 hover:bg-white/10 rounded-lg" aria-label="Previous week">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={handleNext} className="p-2 hover:bg-white/10 rounded-lg" aria-label="Next week">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {isVacationWeek && (
          <div className="mt-4 flex items-center gap-2 text-sm bg-white/10 px-3 py-2 rounded">
            <Info className="w-4 h-4" />
            <span>Vacation week. Michaelmas teaching begins on {format(new Date(termStartDate), 'EEE dd MMM yyyy')}.</span>
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {weekData?.days?.map(d => renderDay(d)) ||
            Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="min-h-[560px] bg-white p-3" />
            ))}
        </div>
      </div>
    </div>
  )
}

export default WeekView
