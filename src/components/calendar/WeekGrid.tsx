// src/components/calendar/WeekGrid.tsx
import React, { useEffect } from 'react';
import { format, addDays, parse } from 'date-fns';

// Helper function to replace parseISO
function parseISO(dateString: string): Date {
  return new Date(dateString + 'T00:00:00.000Z');
}
import { ChevronLeft, ChevronRight, ArrowLeft, Clock } from 'lucide-react';
import { YEAR_LABEL } from '@/lib/calendar/links';
import type { YearKey } from '@/lib/calendar/links';
import type { CalendarEvent } from '@/lib/calendar/useCalendarData';

interface WeekGridProps {
  year: YearKey;
  weekStartISO: string;
  events: CalendarEvent[];
  onPrev: () => void;
  onNext: () => void;
  onBack: () => void;
  gated: boolean;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6:00 to 21:00

function getEventStyle(kind: CalendarEvent['kind']): string {
  switch (kind) {
    case 'lecture': return 'bg-blue-500 text-white border-blue-600';
    case 'seminar': return 'bg-green-500 text-white border-green-600';
    case 'deadline': return 'bg-red-500 text-white border-red-600';
    case 'exam': return 'bg-red-600 text-white border-red-700';
    case 'task': return 'bg-gray-500 text-white border-gray-600';
    case 'routine': return 'bg-purple-500 text-white border-purple-600';
    default: return 'bg-gray-500 text-white border-gray-600';
  }
}

function calculateEventPosition(start: string, end?: string): { top: number; height: number } {
  // Simple time parsing - assumes HH:mm format
  const startParts = start.split(':').map(Number);
  const startHours = startParts[0] || 0;
  const startMinutes = startParts[1] || 0;
  const startHour = startHours + startMinutes / 60;
  const top = Math.max(0, (startHour - 6) * 60); // 60px per hour, offset from 6:00

  let height = 60; // default 1 hour
  if (end) {
    const endParts = end.split(':').map(Number);
    const endHours = endParts[0] || 0;
    const endMinutes = endParts[1] || 0;
    const endHour = endHours + endMinutes / 60;
    height = Math.max(30, (endHour - startHour) * 60); // minimum 30px
  }

  return { top, height };
}

export const WeekGrid: React.FC<WeekGridProps> = ({
  year,
  weekStartISO,
  events,
  onPrev,
  onNext,
  onBack,
  gated
}) => {
  const weekStart = parseISO(weekStartISO);
  const weekEnd = addDays(weekStart, 6);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

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
            {YEAR_LABEL[year]} • Week of {format(weekStart, 'd MMM')}–{format(weekEnd, 'd MMM yyyy')}
          </h1>
        </div>

        <div className="rounded-2xl border bg-white p-8 text-center">
          <h2 className="font-semibold text-lg mb-2">Browse-only</h2>
          <p className="text-gray-600 mb-4">
            Detailed weekly schedules are visible only for your enrolled year. 
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
            title="Previous week (←)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <h1 className="text-2xl font-semibold min-w-[300px] text-center">
            {YEAR_LABEL[year]} • Week of {format(weekStart, 'd MMM')}–{format(weekEnd, 'd MMM yyyy')}
          </h1>
          
          <button
            onClick={onNext}
            className="p-2 rounded-xl border hover:bg-gray-50"
            title="Next week (→)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="text-sm text-gray-500">
          Use ← → keys to navigate
        </div>
      </div>

      {/* Week Grid */}
      <div className="bg-white rounded-2xl shadow border overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-8 border-b bg-gray-50">
          <div className="p-4 border-r">
            <Clock className="w-5 h-5 text-gray-400 mx-auto" />
          </div>
          {weekDays.map((day, index) => (
            <div key={index} className="p-4 text-center border-r last:border-r-0">
              <div className="font-medium text-gray-900">
                {WEEKDAYS[index]}
              </div>
              <div className="text-sm text-gray-500">
                {format(day, 'd MMM')}
              </div>
              
              {/* All-day events */}
              {eventsByDate[format(day, 'yyyy-MM-dd')]?.filter(e => !e.start).map(event => (
                <div
                  key={event.id}
                  className={`mt-1 text-xs px-2 py-1 rounded ${getEventStyle(event.kind)} truncate`}
                  title={`${event.title}${event.details ? ' - ' + event.details : ''}`}
                >
                  {event.title}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Time Grid */}
        <div className="relative">
          <div className="grid grid-cols-8">
            {/* Time Labels */}
            <div className="border-r">
              {HOURS.map(hour => (
                <div key={hour} className="h-[60px] p-2 border-b text-xs text-gray-500 flex items-start">
                  {String(hour).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Day Columns */}
            {weekDays.map((day, dayIndex) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const dayEvents = eventsByDate[dayStr]?.filter(e => e.start) || [];

              return (
                <div key={dayIndex} className="relative border-r last:border-r-0">
                  {/* Hour cells */}
                  {HOURS.map(hour => (
                    <div
                      key={hour}
                      className="h-[60px] border-b border-gray-100 hover:bg-gray-50"
                    />
                  ))}

                  {/* Events */}
                  {dayEvents.map(event => {
                    if (!event.start) return null;
                    
                    const { top, height } = calculateEventPosition(event.start, event.end);
                    
                    return (
                      <div
                        key={event.id}
                        className={`absolute left-1 right-1 rounded border-l-4 px-2 py-1 text-xs z-10 cursor-pointer hover:opacity-90 ${getEventStyle(event.kind)}`}
                        style={{ top: `${top}px`, height: `${height}px`, minHeight: '30px' }}
                        title={`${event.start}${event.end ? '-' + event.end : ''} ${event.title}${event.details ? ' - ' + event.details : ''}`}
                      >
                        <div className="font-medium truncate">
                          {event.title}
                        </div>
                        {event.module && (
                          <div className="text-xs opacity-90 truncate">
                            {event.module}
                          </div>
                        )}
                        <div className="text-xs opacity-80">
                          {event.start}{event.end && `-${event.end}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        Tip: Hover over events for details • Use keyboard arrows to navigate weeks
      </div>

      {/* Mobile responsive hint */}
      <div className="lg:hidden mt-2 text-xs text-gray-500 text-center">
        Scroll horizontally to see all days
      </div>
    </div>
  );
};