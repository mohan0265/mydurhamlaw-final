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

const parseISOUTC = (date: string) => new Date(date + 'T00:00:00.000Z');
import { ChevronLeft, ChevronRight, ArrowLeft, Plus } from 'lucide-react';
import { YEAR_LABEL } from '@/lib/calendar/links';
import type { YearKey, YM } from '@/lib/calendar/links';
import type { NormalizedEvent } from '@/lib/calendar/normalize';
import PersonalItemModal from './PersonalItemModal';

interface MonthGridProps {
  yearKey: YearKey;
  ym: YM;
  events: NormalizedEvent[];
  onPrev: () => void;
  onNext: () => void;
  onBack: () => void;
  gated: boolean;
  loading?: boolean;
  onEventsChange?: () => void;
  onEventClick?: (event: NormalizedEvent) => void;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function badgeStyle(kind: NormalizedEvent['kind'], source?: string): string {
  // Assignments get green styling (from Year View)
  if (source === 'assignment') {
    return 'bg-green-50 text-green-800 border-green-200';
  }
  
  // Personal items get emerald styling 
  if (source === 'personal') {
    return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  }
  
  switch (kind) {
    case 'topic':      return 'bg-blue-50 text-blue-800 border-blue-100';
    case 'assessment': return 'bg-red-50 text-red-700 border-red-100';
    case 'exam':       return 'bg-red-100 text-red-900 border-red-200 font-medium';
    default:           return 'bg-gray-50 text-gray-800 border-gray-100';
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
  if (!a && b)  return -1;
  if (a && !b)  return 1;
  return a!.localeCompare(b!, undefined, { numeric: true });
}

export const MonthGrid: React.FC<MonthGridProps> = ({
  yearKey,
  ym,
  events,
  onPrev,
  onNext,
  onBack,
  gated,
  loading,
  onEventsChange,
  onEventClick,
}) => {
  const [showOverflow, setShowOverflow] = useState<string | null>(null);
  
  // Layer toggles (Part F + Assignments)
  const [showPlan, setShowPlan] = useState(true);
  const [showPersonal, setShowPersonal] = useState(true);
  const [showAssignments, setShowAssignments] = useState(true);
  const [showTimetable, setShowTimetable] = useState(true);
  
  // Personal item modal (Part E integration)
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [modalDate, setModalDate] = useState<string | undefined>();
  const [modalItem, setModalItem] = useState<any>(null);

  const currentDate = new Date(ym.year, ym.month - 1);
  const monthStart  = startOfMonth(currentDate);
  const monthEnd    = endOfMonth(currentDate);
  const calStart    = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd      = endOfWeek(monthEnd,   { weekStartsOn: 1 });
  const days        = useMemo(() => eachDayOfInterval({ start: calStart, end: calEnd }), [calStart, calEnd]);

  // Filter events by layer toggles
  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      const source = ev.meta?.source;
      if (source === 'plan' && !showPlan) return false;
      if (source === 'personal' && !showPersonal) return false;
      if (source === 'assignment' && !showAssignments) return false;
      if (source === 'timetable' && !showTimetable) return false;
      return true;
    });
  }, [events, showPlan, showPersonal, showAssignments, showTimetable]);

  // Group by ISO date
  const eventsByDate = useMemo(() => {
    const map: Record<string, NormalizedEvent[]> = {};
    for (const ev of filteredEvents) {
      (map[ev.date] ||= []).push(ev);
    }
    for (const k of Object.keys(map)) {
      map[k]!.sort((a, b) => timeSort(a.start, b.start));
    }
    return map;
  }, [filteredEvents]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); onPrev(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); onNext(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onPrev, onNext]);

  // Handlers
  const handleAddPersonalItem = (date: string) => {
    setModalDate(date);
    setModalMode('create');
    setModalItem(null);
    setModalOpen(true);
  };

  const handleEventClick = (event: NormalizedEvent) => {
    if (event.meta?.source === 'personal') {
      // Open edit modal
      setModalMode('edit');
      setModalItem({
        id: event.meta.personalItemId,
        title: event.title,
        type: event.meta.type || 'study',
        start_at: event.start_at || `${event.date}T00:00:00Z`,
        end_at: event.end_at,
        is_all_day: event.allDay,
        priority: event.meta.priority || 'medium',
        notes: event.meta.notes,
        completed: event.meta.completed || false,
      });
      setModalOpen(true);
    } else {
      // Plan/timetable events - just call the optional handler
      onEventClick?.(event);
    }
  };

  const handleModalSave = () => {
    setModalOpen(false);
    // Trigger refetch
    onEventsChange?.();
  };

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

        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">Use ← → keys to navigate</div>
          {loading && <span className="text-sm text-gray-400">Loading...</span>}
        </div>
      </div>

      {/* Layer Toggles (Part F + Assignments) */}
      <div className="flex items-center gap-4 mb-4 p-3 bg-white rounded-lg border">
        <span className="text-sm font-medium text-gray-700">Show:</span>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showPlan}
            onChange={(e) => setShowPlan(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm">Plan</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showPersonal}
            onChange={(e) => setShowPersonal(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm">Personal</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showAssignments}
            onChange={(e) => setShowAssignments(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm">Assignments</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showTimetable}
            onChange={(e) => setShowTimetable(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm">Timetable</span>
        </label>
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

            const isCurMonth = isSameMonth(day, currentDate);
            const isCurDay = isToday(parseISOUTC(isoDay));

            const visible = dayEvents.slice(0, 4);
            const overflow = dayEvents.length - visible.length;

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
                {/* Date + Add button */}
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm ${isCurDay ? 'text-blue-700 font-semibold' : isCurMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                    {format(day, 'd')}
                  </span>
                  <div className="flex items-center gap-1">
                    {/* Dots */}
                    {dayEvents.some(e => e.kind === 'exam')       && <span className="w-2 h-2 rounded-full bg-red-500"    title="Exam" />}
                    {dayEvents.some(e => e.kind === 'assessment') && <span className="w-2 h-2 rounded-full bg-orange-500" title="Assessment" />}
                    {dayEvents.some(e => e.kind === 'topic')      && <span className="w-2 h-2 rounded-full bg-blue-500"   title="Topic" />}
                    
                    {/* + Add button (Part E wiring) */}
                    <button
                      onClick={() => handleAddPersonalItem(isoDay)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-green-100 rounded transition"
                      title="Add personal item"
                    >
                      <Plus className="w-3 h-3 text-green-600" />
                    </button>
                  </div>
                </div>

                {/* Events list */}
                <div className="space-y-1">
                  {visible.map((ev) => {
                    const label = ev.title;
                    return (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => handleEventClick(ev)}
                        className={[
                          'text-[11px] px-2 py-1 rounded border truncate cursor-pointer hover:opacity-75 transition-opacity w-full text-left',
                          badgeStyle(ev.kind, ev.meta?.source),
                        ].join(' ')}
                        title={[ev.start ? `${ev.start} - ` : '', label].join('')}
                      >
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
                      {dayEvents.slice(4).map((ev) => {
                        const label = ev.title;
                        return (
                          <button
                            key={ev.id}
                            type="button"
                            onClick={() => handleEventClick(ev)}
                            className={['text-[11px] px-2 py-1 rounded border cursor-pointer hover:opacity-75 transition-opacity w-full text-left', badgeStyle(ev.kind, ev.meta?.source)].join(' ')}
                            title={[ev.start ? `${ev.start} - ` : '', label].join('')}
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
        Tip: Hover over "+N more" to see all events • Use keyboard arrows to navigate months • Click + to add personal items
      </div>

      {/* Personal Item Modal */}
      <PersonalItemModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleModalSave}
        mode={modalMode}
        initialDate={modalDate}
        existingItem={modalItem}
      />
    </div>
  );
};
