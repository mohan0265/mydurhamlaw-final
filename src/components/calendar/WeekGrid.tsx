// src/components/calendar/WeekGrid.tsx
import React, { useEffect, useState } from 'react';
import { format, addDays, isBefore, isAfter, startOfWeek, endOfWeek } from 'date-fns';

const parseISO = (date: string) => new Date(date + 'T00:00:00.000Z');
import { ChevronLeft, ChevronRight, ArrowLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { YEAR_LABEL } from '@/lib/calendar/links';
import type { YearKey } from '@/lib/calendar/links';
import type { CalendarEvent } from '@/lib/calendar/useCalendarData';

interface WeekGridProps {
  yearKey: YearKey;
  mondayISO: string;      // Monday of the week
  events: CalendarEvent[];
  onPrev: () => void;
  onNext: () => void;
  onBack: () => void;
  gated: boolean;
  onEventClick?: (event: CalendarEvent) => void;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6:00 to 21:00

function getEventStyle(kind: CalendarEvent['kind']): string {
  switch (kind) {
    case 'lecture': return 'bg-blue-500 text-white border-l-4 border-blue-600';
    case 'seminar': return 'bg-green-500 text-white border-l-4 border-green-600';
    case 'deadline': return 'bg-red-500 text-white border-l-4 border-red-600';
    case 'exam': return 'bg-red-600 text-white border-l-4 border-red-700 font-medium';
    case 'task': return 'bg-gray-500 text-white border-l-4 border-gray-600';
    case 'all-day': return 'bg-purple-500 text-white border-l-4 border-purple-600';
    default: return 'bg-gray-500 text-white border-l-4 border-gray-600';
  }
}

function getAllDayStyle(kind: CalendarEvent['kind']): string {
  switch (kind) {
    case 'lecture': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'seminar': return 'bg-green-100 text-green-800 border-green-200';
    case 'deadline': return 'bg-red-100 text-red-800 border-red-200';
    case 'exam': return 'bg-red-200 text-red-900 border-red-300 font-medium';
    case 'task': return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'all-day': return 'bg-purple-100 text-purple-800 border-purple-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

// Helper to parse ISO date safely
function parseISODate(dateString: string): Date {
  return new Date(dateString + 'T00:00:00.000Z');
}

export const WeekGrid: React.FC<WeekGridProps> = ({
  yearKey,
  mondayISO,
  events,
  onPrev,
  onNext,
  onBack,
  gated,
  onEventClick
}) => {
  const [expanded, setExpanded] = useState(false);
  
  const weekStart = parseISODate(mondayISO);
  const weekEnd = addDays(weekStart, 6);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Group events by date, plus handle exam window ranges
  const eventsByDate = events.reduce((acc, event) => {
    const dateKey = event.date;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey]!.push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  // Separate exam window events for special handling
  const examWindowEvents = events.filter(ev => ev.subtype === 'exam_window');
  const regularAllDayEvents = (date: string) => 
    (eventsByDate[date] || []).filter(ev => !ev.start && ev.subtype !== 'exam_window');

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
            {YEAR_LABEL[yearKey]} • Week of {format(weekStart, 'd MMM')}–{format(weekEnd, 'd MMM yyyy')}
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
            {YEAR_LABEL[yearKey]} • Week of {format(weekStart, 'd MMM')}–{format(weekEnd, 'd MMM yyyy')}
          </h1>
          
          <button
            onClick={onNext}
            className="p-2 rounded-xl border hover:bg-gray-50"
            title="Next week (→)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => setExpanded(v => !v)}
            size="sm"
          >
            {expanded ? "Collapse all" : "Expand all"}
          </Button>
          <div className="text-sm text-gray-500">
            Use ← → keys to navigate
          </div>
        </div>
      </div>

      {/* Week Grid */}
      <div className="bg-white rounded-2xl shadow border overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-8 border-b bg-gray-50">
          <div className="p-4 border-r flex items-center justify-center">
            <Clock className="w-5 h-5 text-gray-400" />
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
              {regularAllDayEvents(format(day, 'yyyy-MM-dd')).map(event => {
                const label = event.title.length > 15 ? event.title.substring(0, 13) + '...' : event.title;
                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => onEventClick?.(event)}
                    className={`mt-1 text-xs px-2 py-1 rounded border ${getAllDayStyle(event.kind)} truncate cursor-pointer hover:opacity-75 transition-opacity w-full text-left`}
                    title={`${event.title}${event.details ? ' - ' + event.details : ''}`}
                  >
                    {label}
                  </button>
                );
              })}
              
              {/* Exam windows - show once on Monday if intersects the week */}
              {index === 0 && examWindowEvents.map(ev => {
                if (!ev.endDate) return null;
                
                const isRange = !!ev.allDay && !!ev.date && !!ev.endDate;
                const intersectsWeek =
                  isRange &&
                  isBefore(parseISO(ev.date), endOfWeek(weekStart, { weekStartsOn: 1 })) &&
                  isAfter(parseISO(ev.endDate), startOfWeek(weekStart, { weekStartsOn: 1 }));

                if (!intersectsWeek) return null;

                const label = `${ev.title} (${format(parseISO(ev.date), "d MMM")}–${format(parseISO(ev.endDate), "d MMM")})`;
                const shortLabel = label.length > 15 ? label.substring(0, 13) + '...' : label;
                
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => onEventClick?.(ev)}
                    className={`mt-1 text-xs px-2 py-1 rounded border ${getAllDayStyle(ev.kind)} truncate cursor-pointer hover:opacity-75 transition-opacity w-full text-left`}
                    title={`${label}${ev.details ? ' - ' + ev.details : ''}`}
                  >
                    {shortLabel}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Time Grid */}
        <div className="relative overflow-x-auto lg:overflow-x-visible">
          <div className="grid grid-cols-8 min-w-[800px] lg:min-w-0">
            {/* Time Labels */}
            <div className="border-r bg-gray-50">
              {HOURS.map(hour => (
                <div key={hour} className="h-[60px] p-2 border-b text-xs text-gray-500 flex items-start justify-end">
                  <span className="bg-gray-50 px-1 -mt-2">
                    {String(hour).padStart(2, '0')}:00
                  </span>
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
                      className="h-[60px] border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    />
                  ))}

                  {/* Timed Events */}
                  {dayEvents.map((event, eventIndex) => {
                    if (!event.start) return null;
                    
                    const { top, height } = calculateEventPosition(event.start, event.end);
                    
                    return (
                      <div
                        key={event.id}
                        className={`absolute left-1 right-1 rounded px-2 py-1 text-xs z-10 cursor-pointer hover:opacity-90 transition-opacity ${getEventStyle(event.kind)}`}
                        style={{ 
                          top: `${top}px`, 
                          height: `${height}px`, 
                          minHeight: '30px',
                          // Offset multiple events slightly
                          left: eventIndex > 0 ? `${4 + eventIndex * 2}px` : '4px',
                          right: `${4}px`,
                          zIndex: 10 + eventIndex
                        }}
                        title={`${event.start}${event.end ? '-' + event.end : ''}\n${event.title}${event.details ? '\n' + event.details : ''}`}
                      >
                        <div className="font-medium truncate leading-tight">
                          {event.kind === 'lecture' || event.kind === 'seminar' 
                            ? event.module?.split(' ').slice(0, 2).join(' ') || event.title
                            : event.title}
                        </div>
                        {event.module && (event.kind === 'deadline' || event.kind === 'exam') && (
                          <div className="text-xs opacity-90 truncate leading-tight">
                            {event.module.split(' ').slice(0, 2).join(' ')}
                          </div>
                        )}
                        <div className="text-xs opacity-80 leading-tight">
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

      {/* Expanded event list */}
      {expanded && (
        <div className="mt-6 bg-white rounded-2xl shadow border p-6">
          <h3 className="text-lg font-semibold mb-4">All Events This Week</h3>
          <div className="space-y-3">
            {events.length === 0 ? (
              <p className="text-gray-500 text-sm">No events scheduled for this week</p>
            ) : (
              events.map(event => {
                const isRange = !!event?.allDay && !!event?.date && !!event?.endDate;
                const label =
                  event?.subtype === 'exam_window' && isRange
                    ? `${event.title} (${format(parseISO(event.date), "d MMM")}–${format(parseISO(event.endDate!), "d MMM")})`
                    : event.title;
                
                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => onEventClick?.(event)}
                    className={`w-full text-left p-3 rounded border cursor-pointer hover:opacity-75 transition-opacity ${getAllDayStyle(event.kind)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm mb-1">{label}</div>
                        <div className="text-xs opacity-75">
                          {event.start ? (
                            <>
                              {format(parseISO(event.date), "EEE, MMM d")} • {event.start}
                              {event.end && `–${event.end}`}
                            </>
                          ) : event.allDay ? (
                            <>
                              {isRange ? (
                                `${format(parseISO(event.date), "EEE, MMM d")} – ${format(parseISO(event.endDate!), "EEE, MMM d")}`
                              ) : (
                                `${format(parseISO(event.date), "EEE, MMM d")} (all day)`
                              )}
                            </>
                          ) : (
                            format(parseISO(event.date), "EEE, MMM d")
                          )}
                        </div>
                        {event.details && (
                          <div className="text-xs opacity-60 mt-1">{event.details}</div>
                        )}
                      </div>
                      <div className="ml-3 text-xs font-medium opacity-75">
                        {event.module || event.moduleCode}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500 text-center">
        Tip: Hover over events for details • Use keyboard arrows to navigate weeks
      </div>

      {/* Mobile responsive hint */}
      <div className="lg:hidden mt-2 text-xs text-gray-500 text-center">
        Scroll horizontally to see all days of the week
      </div>
    </div>
  );
};