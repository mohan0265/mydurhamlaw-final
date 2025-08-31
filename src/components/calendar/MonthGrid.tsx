// src/components/calendar/MonthGrid.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isToday,
  } from 'date-fns';

const parseISO = (date: string) => new Date(date + 'T00:00:00.000Z');
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
  onEventClick?: (event: CalendarEvent) => void;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function badgeStyle(kind: CalendarEvent['kind']): string {
  switch (kind) {
    case 'lecture':   return 'bg-blue-50 text-blue-800 border-blue-100';
    case 'seminar':   return 'bg-green-50 text-green-800 border-green-100';
    case 'deadline':  return 'bg-red-50 text-red-700 border-red-100';
    case 'exam':      return 'bg-red-100 text-red-900 border-red-200 font-medium';
    case 'task':      return 'bg-gray-50 text-gray-800 border-gray-100';
    case 'all-day':   return 'bg-purple-50 text-purple-700 border-purple-100';
    default:          return 'bg-gray-50 text-gray-800 border-gray-100';
  }
}

function eachDayOfInterval(interval: { start: Date; end: Date }): Date[] {
  const days: Date[] = [];
  let d = new Date(interval.start);
  while (d <= interval.end) {
    days.push(new Date(d));
    d = addDays(d, 1);
  }
  return days;
}

function timeSort(a?: string, b?: string) {
  if (!a && !b) return 0;
  if (!a) return 1; // all-day first
  if (!b) return -1;
  return a.localeCompare(b, undefined, { numeric: true });
}

const occursOnDay = (ev: any, dayISO: string) => {
  if (ev?.allDay && ev?.date) return ev.date === dayISO;
  if (ev?.start_at) return ev.start_at.slice(0, 10) === dayISO;
  return false;
};

export const MonthGrid: React.FC<MonthGridProps> = ({
  yearKey,
  ym,
  events,
  onPrev,
  onNext,
  onBack,
  gated,
  onEventClick,
}) => {
  const [showOverflow, setShowOverflow] = useState<string | null>(null);

  const currentDate = new Date(ym.year, ym.month - 1);
  const monthStart  = startOfMonth(currentDate);
  const monthEnd    = endOfMonth(currentDate);
  const calStart    = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd      = endOfWeek(monthEnd,   { weekStartsOn: 1 });
  const days        = useMemo(() => eachDayOfInterval({ start: calStart, end: calEnd }), [calStart, calEnd]);

  // Group by ISO date
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const ev of events) {
      (map[ev.date] ||= []).push(ev);
    }
    // sort each day: all-day first (no start), then timed by HH:mm
    for (const k of Object.keys(map)) {
      const arr = map[k]!;              // assert non-null: key came from Object.keys(map)
      arr.sort((a, b) => timeSort(a.start, b.start));
    }

    return map;
  }, [events]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); onPrev(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); onNext(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onPrev, onNext]);

  if (gated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="flex items-center gap-2 text-purple-700 hover:underline">
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
          <button onClick={onBack} className="px-4 py-2 rounded-xl bg-purple-700 text-white hover:opacity-95">
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
        <button onClick={onBack} className="flex items-center gap-2 text-purple-700 hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Back to Year
        </button>

        <div className="flex items-center gap-4">
          <button onClick={onPrev} className="p-2 rounded-xl border hover:bg-gray-50" title="Previous month (←)">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-semibold min-w-[220px] text-center">
            {YEAR_LABEL[yearKey]} • {format(currentDate, 'MMMM yyyy')}
          </h1>
          <button onClick={onNext} className="p-2 rounded-xl border hover:bg-gray-50" title="Next month (→)">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="text-sm text-gray-500">Use ← → keys to navigate</div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl shadow border overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b bg-gray-50">
          {WEEKDAYS.map((d) => (
            <div key={d} className="p-3 text-center font-medium text-gray-600 border-r last:border-r-0">
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const isoDay = format(day, 'yyyy-MM-dd');
            const dayEvents = eventsByDate[isoDay] || [];
            const allDayEventsForThisDay = events.filter((e: any) => e.allDay && occursOnDay(e, isoDay));
            const timedEventsForThisDay = dayEvents.filter(e => !e.allDay);
            const allEventsForThisDay = [...allDayEventsForThisDay, ...timedEventsForThisDay];
            const isCurMonth = isSameMonth(day, currentDate);
            const isCurDay = isToday(new Date(isoDay + 'T00:00:00Z'));

            // show up to 4 items, overflow into a hover card
            const visible = allEventsForThisDay.slice(0, 4);
            const overflow = allEventsForThisDay.length - visible.length;

            return (
              <div
                key={isoDay}
                className={[
                  'min-h-[130px] p-2 border-r border-b relative group transition-colors',
                  isCurMonth ? 'bg-white' : 'bg-gray-50',
                  isCurDay ? 'ring-2 ring-blue-300 bg-blue-50' : '',
                ].join(' ')}
                style={{ gridColumn: (idx % 7) + 1 }}
              >
                {/* Date + dots */}
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm ${isCurDay ? 'text-blue-700 font-semibold' : isCurMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                    {format(day, 'd')}
                  </span>
                  <div className="flex gap-1">
                    {allEventsForThisDay.some(e => e.kind === 'exam')     && <span className="w-2 h-2 rounded-full bg-red-500"    title="Exam" />}
                    {allEventsForThisDay.some(e => e.kind === 'deadline') && <span className="w-2 h-2 rounded-full bg-orange-500" title="Deadline" />}
                    {allEventsForThisDay.some(e => e.kind === 'lecture')  && <span className="w-2 h-2 rounded-full bg-blue-500"   title="Lecture" />}
                  </div>
                </div>

                {/* Events list: all-day items render WITHOUT a time; timed items show HH:mm */}
                <div className="space-y-1">
                  {visible.map((ev) => {
                    // Build appropriate label for exam windows
                    const isRange = !!ev?.allDay && !!ev?.date && !!ev?.endDate;
                    const label =
                      ev?.subtype === 'exam_window' && isRange
                        ? `${ev.title} (${format(parseISO(ev.date), "d MMM")}–${format(parseISO(ev.endDate!), "d MMM")})`
                        : ev.title;
                    
                    return (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => onEventClick?.(ev)}
                        className={[
                          'text-[11px] px-2 py-1 rounded border truncate cursor-pointer hover:opacity-75 transition-opacity w-full text-left',
                          badgeStyle(ev.kind),
                        ].join(' ')}
                        title={[ev.start ? `${ev.start} — ` : '', label, ev.details ? `\n${ev.details}` : ''].join('')}
                      >
                        {/* Only show a time if start exists */}
                        {ev.start ? <span className="font-mono mr-1">{ev.start}</span> : null}
                        <span className="truncate">{label}</span>
                      </button>
                    );
                  })}

                  {overflow > 0 && (
                    <button
                      className="text-xs text-gray-500 hover:text-gray-700 w-full text-left"
                      onMouseEnter={() => setShowOverflow(isoDay)}
                      onMouseLeave={() => setShowOverflow(null)}
                    >
                      +{overflow} more
                    </button>
                  )}
                </div>

                {/* Overflow hover card */}
                {showOverflow === isoDay && overflow > 0 && (
                  <div className="absolute z-50 left-0 top-full mt-1 bg-white border rounded-lg shadow-lg p-3 min-w-[220px]">
                    <div className="text-sm font-medium mb-2">{format(day, 'MMM d')}</div>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {allEventsForThisDay.slice(4).map((ev) => {
                        // Build appropriate label for exam windows
                        const isRange = !!ev?.allDay && !!ev?.date && !!ev?.endDate;
                        const label =
                          ev?.subtype === 'exam_window' && isRange
                            ? `${ev.title} (${format(parseISO(ev.date), "d MMM")}–${format(parseISO(ev.endDate!), "d MMM")})`
                            : ev.title;
                        
                        return (
                          <button 
                            key={ev.id} 
                            type="button"
                            onClick={() => onEventClick?.(ev)}
                            className={['text-[11px] px-2 py-1 rounded border cursor-pointer hover:opacity-75 transition-opacity w-full text-left', badgeStyle(ev.kind)].join(' ')}
                          >
                            {ev.start ? <span className="font-mono mr-1">{ev.start}</span> : null}
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        Tip: Hover over “+N more” to see all events • Use keyboard arrows to navigate months
      </div>
    </div>
  );
};
