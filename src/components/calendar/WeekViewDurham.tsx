// src/components/calendar/WeekViewDurham.tsx
// Enhanced week view matching Durham University MyTimetable UX
// Events grouped by day with smooth scrolling

import React, { useMemo, useState } from 'react';
import { 
  format, 
  startOfWeek, 
  endOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  isToday,
  isSameDay
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Plus, ArrowLeft } from 'lucide-react';
import { DurhamStyleEventCard, EventType, DurhamEventCardProps } from './DurhamStyleEventCard';
import type { NormalizedEvent } from '@/lib/calendar/normalize';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Durham academic term calculation
function getTermInfo(date: Date): { term: string; week: number } | null {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  if (month >= 10 && month <= 12) {
    const weekNum = Math.ceil((day + (month - 10) * 30) / 7);
    return { term: 'Michaelmas Term', week: Math.min(weekNum, 12) };
  }
  if (month >= 1 && month <= 3) {
    const weekNum = Math.ceil((day + (month - 1) * 30) / 7);
    return { term: 'Epiphany Term', week: Math.min(weekNum, 12) };
  }
  if (month >= 4 && month <= 6) {
    const weekNum = Math.ceil((day + (month - 4) * 30) / 7);
    return { term: 'Easter Term', week: Math.min(weekNum, 10) };
  }
  
  return null;
}

// Map NormalizedEvent to card props
function eventToCardProps(event: NormalizedEvent): DurhamEventCardProps {
  const source = event.meta?.source as any;
  
  let type: EventType = 'other';
  if (source === 'timetable' || source === 'ics') {
    const titleLower = event.title.toLowerCase();
    if (titleLower.includes('lecture')) type = 'lecture';
    else if (titleLower.includes('seminar')) type = 'seminar';
    else if (titleLower.includes('tutorial')) type = 'tutorial';
    else type = 'lecture';
  } else if (source === 'assignment') {
    type = 'deadline';
  } else if (source === 'personal') {
    type = 'personal';
  } else if (event.kind === 'assessment' || event.kind === 'exam') {
    type = 'assessment';
  }
  
  const moduleMatch = event.title.match(/^([A-Z]{3,4}\d{4})\s*[-–]\s*(.+)$/);
  const moduleCode = moduleMatch?.[1] || event.meta?.module_code;
  const cleanTitle = moduleMatch?.[2] || event.title;
  
  return {
    id: event.id,
    title: cleanTitle,
    moduleCode,
    startTime: event.start,
    endTime: event.end,
    location: event.meta?.location,
    lecturer: event.meta?.lecturer,
    type,
    isAllDay: event.allDay,
    source,
    dueTime: event.meta?.dueTime,
    submissionUrl: event.meta?.submissionUrl,
  };
}

interface WeekViewDurhamProps {
  events: NormalizedEvent[];
  currentWeek?: Date;
  onWeekChange?: (date: Date) => void;
  onBack?: () => void;
  onAddEvent?: (date: string) => void;
  onEventClick?: (event: NormalizedEvent) => void;
  loading?: boolean;
}

export const WeekViewDurham: React.FC<WeekViewDurhamProps> = ({
  events,
  currentWeek: initialWeek,
  onWeekChange,
  onBack,
  onAddEvent,
  onEventClick,
  loading = false
}) => {
  const [currentWeek, setCurrentWeek] = useState(initialWeek || new Date());
  
  // Calculate week bounds
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  
  // Generate days of the week
  const days = useMemo(() => {
    const result: Date[] = [];
    for (let i = 0; i < 7; i++) {
      result.push(addDays(weekStart, i));
    }
    return result;
  }, [weekStart.toISOString()]);
  
  // Group events by date
  const eventsByDate = useMemo(() => {
    const map: Record<string, NormalizedEvent[]> = {};
    for (const ev of events) {
      const key = ev.date;
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    }
    for (const key of Object.keys(map)) {
      map[key]?.sort((a, b) => (a.start || '').localeCompare(b.start || ''));
    }
    return map;
  }, [events]);
  
  // Term info
  const termInfo = getTermInfo(currentWeek);
  
  // Navigation
  const handlePrevWeek = () => {
    const newWeek = subWeeks(currentWeek, 1);
    setCurrentWeek(newWeek);
    onWeekChange?.(newWeek);
  };
  
  const handleNextWeek = () => {
    const newWeek = addWeeks(currentWeek, 1);
    setCurrentWeek(newWeek);
    onWeekChange?.(newWeek);
  };
  
  const handleToday = () => {
    const today = new Date();
    setCurrentWeek(today);
    onWeekChange?.(today);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header - matching MyTimetable weekly view */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-t-2xl p-4">
        <div className="flex items-center justify-between">
          {/* Back button */}
          {onBack && (
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-white/80 hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </button>
          )}
          
          {/* Week navigation */}
          <div className="flex items-center gap-4">
            <button 
              onClick={handlePrevWeek}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="text-center min-w-[280px]">
              <h1 className="text-xl font-bold text-white">
                {format(weekStart, 'EEEE, d')} - {format(weekEnd, 'EEEE, d MMMM')}
              </h1>
              {termInfo && (
                <p className="text-sm text-white/80 mt-0.5">
                  {termInfo.term} - Teaching Week {termInfo.week}
                </p>
              )}
            </div>
            
            <button 
              onClick={handleNextWeek}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition text-white"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          {/* Today button */}
          <button
            onClick={handleToday}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition"
          >
            Go to Today
          </button>
        </div>
      </div>
      
      {/* Week content */}
      <div className="bg-white rounded-b-2xl border-x border-b border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-gray-500">
            <div className="animate-spin w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-2" />
            Loading events...
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {days.map((day, idx) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayEvents = eventsByDate[dateKey] || [];
              const hasEvents = dayEvents.length > 0;
              const isCurrentDay = isToday(day);
              
              return (
                <div key={dateKey} className={`${isCurrentDay ? 'bg-purple-50/50' : ''}`}>
                  {/* Day header - matching MyTimetable style */}
                  <div className={`
                    flex items-center justify-between px-6 py-4
                    ${isCurrentDay ? 'bg-purple-100' : 'bg-gray-50'}
                  `}>
                    <div className="flex items-center gap-3">
                      <span className={`
                        text-lg font-bold
                        ${isCurrentDay ? 'text-purple-700' : 'text-gray-900'}
                      `}>
                        {WEEKDAYS[idx]}
                      </span>
                      <span className={`
                        text-sm
                        ${isCurrentDay ? 'text-purple-600' : 'text-gray-500'}
                      `}>
                        {format(day, 'd MMMM')}
                      </span>
                      {isCurrentDay && (
                        <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full font-medium">
                          TODAY
                        </span>
                      )}
                    </div>
                    
                    {/* Add button */}
                    {onAddEvent && (
                      <button
                        onClick={() => onAddEvent(dateKey)}
                        className="opacity-0 group-hover:opacity-100 hover:opacity-100 p-2 rounded-lg hover:bg-white transition"
                        title="Add event"
                      >
                        <Plus className="w-4 h-4 text-gray-600" />
                      </button>
                    )}
                  </div>
                  
                  {/* Events list */}
                  <div className="px-6 py-4">
                    {hasEvents ? (
                      <div className="space-y-3">
                        {dayEvents.map(event => (
                          <DurhamStyleEventCard
                            key={event.id}
                            {...eventToCardProps(event)}
                            onClick={() => onEventClick?.(event)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="py-4 text-center text-gray-400 text-sm">
                        No events scheduled
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Footer tip */}
      <div className="mt-4 text-center text-xs text-gray-400">
        💡 Use arrow buttons to navigate weeks • Click events to view details
      </div>
    </div>
  );
};

export default WeekViewDurham;
