// src/components/calendar/MonthGrid.tsx
import React, { useEffect, useState } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays,
  isSameMonth, 
  isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { YEAR_LABEL } from '@/lib/calendar/links';
import type { YearKey, YM } from '@/lib/calendar/links';
import type { CalendarEvent } from '@/lib/calendar/useCalendarData';

interface MonthGridProps {
  yearKey: YearKey;
  ym: YM;
  events: CalendarEvent[];
  onPrev: () => void;
  onNext: () => void;
  onBack: () => void;
  gated: boolean;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getEventBadgeStyle(kind: CalendarEvent['kind']): string {
  switch (kind) {
    case 'lecture': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'seminar': return 'bg-green-100 text-green-800 border-green-200';
    case 'deadline': return 'bg-red-100 text-red-800 border-red-200';
    case 'exam': return 'bg-red-200 text-red-900 border-red-300 font-medium';
    case 'task': return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'all-day': return 'bg-purple-50 text-purple-700 border-purple-100';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

// Helper function to generate calendar days
function eachDayOfInterval(interval: { start: Date; end: Date }): Date[] {
  const days: Date[] = [];
  let currentDay = new Date(interval.start);
  
  while (currentDay <= interval.end) {
    days.push(new Date(currentDay));
    currentDay = addDays(currentDay, 1);
  }
  
  return days;
}

export const MonthGrid: React.FC<MonthGridProps> = ({
  yearKey,
  ym,
  events,
  onPrev,
  onNext,
  onBack,
  gated
}) => {
  const [showOverflow, setShowOverflow] = useState<string | null>(null);

  const currentDate = new Date(ym.year, ym.month - 1);
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Group events by date
  const eventsByDate = events.reduce((acc, event) => {
    const dateKey = event.date;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey]!.push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPrev, onNext]);

  if (gated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-purple-700 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Year
          </button>
          <h1 className="text-xl font-semibold">
            {YEAR_LABEL[yearKey]} • {format(currentDate, 'MMMM yyyy')}
          </h1>
        </div>

        <div className="rounded-2xl border bg-white p-8 text-center">
          <h2 className="font-semibold text-lg mb-2">Browse-only</h2>
          <p className="text-gray-600 mb-4">
            Detailed monthly schedules are visible only for your enrolled year. 
            Use the Year page to explore the syllabus outline.
          </p>
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-purple-700 text-white hover:opacity-95"
          >
            Back to Year View
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-purple-700 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Year
        </button>

        <div className="flex items-center gap-4">
          <button
            onClick={onPrev}
            className="p-2 rounded-xl border hover:bg-gray-50"
            title="Previous month (←)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <h1 className="text-2xl font-semibold min-w-[200px] text-center">
            {YEAR_LABEL[yearKey]} • {format(currentDate, 'MMMM yyyy')}
          </h1>
          
          <button
            onClick={onNext}
            className="p-2 rounded-xl border hover:bg-gray-50"
            title="Next month (→)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="text-sm text-gray-500">
          Use ← → keys to navigate
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl shadow border overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b bg-gray-50">
          {WEEKDAYS.map(day => (
            <div key={day} className="p-4 text-center font-medium text-gray-600 border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day: Date, index: number) => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const dayEvents = eventsByDate[dayStr] || [];
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isCurrentDay = isToday(day);
            const visibleEvents = dayEvents.slice(0, 3);
            const overflowCount = Math.max(0, dayEvents.length - 3);

            return (
              <div
                key={dayStr}
                className={`min-h-[120px] p-3 border-r border-b last-in-row:border-r-0 relative group hover:bg-gray-50 transition-colors ${
                  isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                } ${isCurrentDay ? 'bg-blue-50 ring-2 ring-blue-200' : ''}`}
                style={{ 
                  gridColumn: index % 7 + 1 
                }}
              >
                {/* Date Number */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${
                    isCurrentDay ? 'text-blue-600 font-bold' :
                    isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {format(day, 'd')}
                  </span>

                  {/* Event Type Indicators */}
                  <div className="flex gap-1">
                    {dayEvents.some(e => e.kind === 'exam') && (
                      <div className="w-2 h-2 bg-red-500 rounded-full" title="Exam" />
                    )}
                    {dayEvents.some(e => e.kind === 'deadline') && (
                      <div className="w-2 h-2 bg-orange-500 rounded-full" title="Deadline" />
                    )}
                    {dayEvents.some(e => e.kind === 'lecture') && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full" title="Lecture" />
                    )}
                  </div>
                </div>

                {/* Events */}
                <div className="space-y-1">
                  {visibleEvents.map(event => (
                    <div
                      key={event.id}
                      className={`text-xs px-2 py-1 rounded border ${getEventBadgeStyle(event.kind)} truncate cursor-pointer hover:opacity-80`}
                      title={`${event.start ? event.start + ' - ' : ''}${event.title}${event.details ? '\n' + event.details : ''}`}
                    >
                      {event.start && (
                        <span className="font-mono text-xs">{event.start} </span>
                      )}
                      <span className="truncate">
                        {event.kind === 'lecture' || event.kind === 'seminar' 
                          ? event.module?.split(' ').slice(0, 2).join(' ') 
                          : event.title.length > 20 
                            ? event.title.substring(0, 18) + '...' 
                            : event.title}
                      </span>
                    </div>
                  ))}
                  
                  {overflowCount > 0 && (
                    <button
                      className="text-xs text-gray-500 font-medium hover:text-gray-700 w-full text-left"
                      onMouseEnter={() => setShowOverflow(dayStr)}
                      onMouseLeave={() => setShowOverflow(null)}
                    >
                      +{overflowCount} more
                    </button>
                  )}
                </div>

                {/* Overflow Popup */}
                {showOverflow === dayStr && overflowCount > 0 && (
                  <div className="absolute z-50 left-0 top-full mt-1 bg-white border rounded-lg shadow-lg p-3 min-w-[200px]">
                    <div className="text-sm font-medium mb-2">{format(day, 'MMM d')}</div>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {dayEvents.slice(3).map(event => (
                        <div
                          key={event.id}
                          className={`text-xs px-2 py-1 rounded border ${getEventBadgeStyle(event.kind)}`}
                        >
                          {event.start && (
                            <span className="font-mono">{event.start} </span>
                          )}
                          {event.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        Tip: Hover over "+N more" to see all events • Use keyboard arrows to navigate months
      </div>
    </div>
  );
};