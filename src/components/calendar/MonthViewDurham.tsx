// src/components/calendar/MonthViewDurham.tsx
// Enhanced month view matching Durham University MyTimetable UX
// Features: Click-to-expand events panel, event dots, term context header

import React, { useEffect, useMemo, useState } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth, 
  isToday,
  isSameDay
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Plus, ArrowLeft } from 'lucide-react';
import { DurhamStyleEventCard, EventType, DurhamEventCardProps } from './DurhamStyleEventCard';
import type { NormalizedEvent } from '@/lib/calendar/normalize';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Durham academic term calculation
function getTermInfo(date: Date): { term: string; week: number } | null {
  const month = date.getMonth() + 1; // 1-indexed
  const day = date.getDate();
  
  // Approximate Durham terms (adjust based on actual dates)
  // Michaelmas: Oct - Dec
  if (month >= 10 && month <= 12) {
    const weekNum = Math.ceil((day + (month - 10) * 30) / 7);
    return { term: 'Michaelmas Term', week: Math.min(weekNum, 12) };
  }
  // Epiphany: Jan - Mar
  if (month >= 1 && month <= 3) {
    const weekNum = Math.ceil((day + (month - 1) * 30) / 7);
    return { term: 'Epiphany Term', week: Math.min(weekNum, 12) };
  }
  // Easter: Apr - Jun
  if (month >= 4 && month <= 6) {
    const weekNum = Math.ceil((day + (month - 4) * 30) / 7);
    return { term: 'Easter Term', week: Math.min(weekNum, 10) };
  }
  
  return null;
}

// Map NormalizedEvent to card props
function eventToCardProps(event: NormalizedEvent): DurhamEventCardProps {
  const source = event.meta?.source as any;
  
  // Determine event type
  let type: EventType = 'other';
  if (source === 'timetable' || source === 'ics') {
    // Check title for type hints
    const titleLower = event.title.toLowerCase();
    if (titleLower.includes('lecture')) type = 'lecture';
    else if (titleLower.includes('seminar')) type = 'seminar';
    else if (titleLower.includes('tutorial')) type = 'tutorial';
    else type = 'lecture'; // Default timetable events to lecture
  } else if (source === 'assignment') {
    type = 'deadline';
  } else if (source === 'personal') {
    type = 'personal';
  } else if (event.kind === 'assessment' || event.kind === 'exam') {
    type = 'assessment';
  }
  
  // Extract module code from title (e.g., "LAW1091 - UK Constitutional Law")
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

interface MonthViewDurhamProps {
  events: NormalizedEvent[];
  currentMonth?: Date;
  onMonthChange?: (date: Date) => void;
  onBack?: () => void;
  onAddEvent?: (date: string) => void;
  onEventClick?: (event: NormalizedEvent) => void;
  loading?: boolean;
}

export const MonthViewDurham: React.FC<MonthViewDurhamProps> = ({
  events,
  currentMonth: initialMonth,
  onMonthChange,
  onBack,
  onAddEvent,
  onEventClick,
  loading = false
}) => {
  const [currentMonth, setCurrentMonth] = useState(initialMonth || new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  
  // Calculate calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  // Generate all days in the grid
  const days = useMemo(() => {
    const result: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      result.push(day);
      day = addDays(day, 1);
    }
    return result;
  }, [calStart.toISOString(), calEnd.toISOString()]);
  
  // Group events by date
  const eventsByDate = useMemo(() => {
    const map: Record<string, NormalizedEvent[]> = {};
    for (const ev of events) {
      const key = ev.date;
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    }
    // Sort each day's events by time
    for (const key of Object.keys(map)) {
      map[key]?.sort((a, b) => (a.start || '').localeCompare(b.start || ''));
    }
    return map;
  }, [events]);
  
  // Events for selected date
  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, 'yyyy-MM-dd');
    return eventsByDate[key] || [];
  }, [selectedDate, eventsByDate]);
  
  // Term info for selected date
  const termInfo = selectedDate ? getTermInfo(selectedDate) : null;
  
  // Navigation handlers
  const handlePrevMonth = () => {
    const newMonth = subMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth);
  };
  
  const handleNextMonth = () => {
    const newMonth = addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth);
  };
  
  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
    onMonthChange?.(today);
  };
  
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };
  
  // Count event types for dots
  const getEventDots = (date: Date) => {
    const key = format(date, 'yyyy-MM-dd');
    const dayEvents = eventsByDate[key] || [];
    
    const hasLecture = dayEvents.some(e => 
      e.meta?.source === 'timetable' || e.meta?.source === 'ics'
    );
    const hasAssignment = dayEvents.some(e => 
      e.meta?.source === 'assignment' || e.kind === 'assessment'
    );
    const hasPersonal = dayEvents.some(e => 
      e.meta?.source === 'personal'
    );
    
    return { hasLecture, hasAssignment, hasPersonal, count: dayEvents.length };
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header - Matching MyTimetable style */}
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
          
          {/* Month navigation */}
          <div className="flex items-center gap-4">
            <button 
              onClick={handlePrevMonth}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <h1 className="text-2xl font-bold text-white min-w-[200px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </h1>
            
            <button 
              onClick={handleNextMonth}
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
      
      {/* Calendar Grid */}
      <div className="bg-white border-x border-gray-200">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b bg-gray-50">
          {WEEKDAYS.map(day => (
            <div 
              key={day} 
              className="py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wide"
            >
              {day}
            </div>
          ))}
        </div>
        
        {/* Days grid */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isCurrentDay = isToday(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const { hasLecture, hasAssignment, hasPersonal, count } = getEventDots(day);
            
            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDateClick(day)}
                className={`
                  relative min-h-[80px] p-2 border-b border-r transition-all
                  ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                  ${isSelected ? 'ring-2 ring-purple-500 ring-inset bg-purple-50' : ''}
                  ${isCurrentDay && !isSelected ? 'bg-blue-50' : ''}
                  hover:bg-gray-100
                  ${idx % 7 === 6 ? 'border-r-0' : ''}
                `}
              >
                {/* Date number */}
                <div className={`
                  text-lg font-medium mb-1
                  ${isCurrentDay ? 'w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center' : ''}
                  ${!isCurrentMonth && !isCurrentDay ? 'text-gray-400' : 'text-gray-900'}
                `}>
                  {format(day, 'd')}
                </div>
                
                {/* Event dots - matching MyTimetable */}
                {count > 0 && (
                  <div className="flex items-center justify-center gap-0.5 mt-1">
                    {hasLecture && (
                      <span className="w-2 h-2 rounded-full bg-purple-500" title="Lecture/Event" />
                    )}
                    {hasAssignment && (
                      <span className="w-2 h-2 rounded-full bg-orange-500" title="Due Date" />
                    )}
                    {hasPersonal && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" title="Personal" />
                    )}
                    {count > 3 && (
                      <span className="text-[10px] text-gray-400 ml-1">+{count - 3}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Events Panel - Matching MyTimetable's below-grid style */}
      <div className="bg-gray-50 rounded-b-2xl border-x border-b border-gray-200 p-6">
        {/* Selected date header */}
        {selectedDate && (
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  <Calendar className="w-5 h-5 inline-block mr-2 text-purple-600" />
                  {format(selectedDate, 'EEEE, d MMMM yyyy')}
                </h2>
                {termInfo && (
                  <p className="text-sm text-purple-600 mt-1 font-medium">
                    {termInfo.term} - Teaching Week {termInfo.week}
                  </p>
                )}
              </div>
              
              {/* Add event button */}
              {onAddEvent && (
                <button
                  onClick={() => onAddEvent(format(selectedDate, 'yyyy-MM-dd'))}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Event
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Loading state */}
        {loading && (
          <div className="py-8 text-center text-gray-500">
            <div className="animate-spin w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-2" />
            Loading events...
          </div>
        )}
        
        {/* Events list */}
        {!loading && selectedEvents.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium">No events scheduled</p>
            <p className="text-sm mt-1">Click the + button to add something</p>
          </div>
        )}
        
        {!loading && selectedEvents.length > 0 && (
          <div className="space-y-3">
            {selectedEvents.map(event => (
              <DurhamStyleEventCard
                key={event.id}
                {...eventToCardProps(event)}
                onClick={() => onEventClick?.(event)}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Footer tip */}
      <div className="mt-4 text-center text-xs text-gray-400">
        💡 Click any date to see events • Purple dots = lectures • Orange dots = due dates
      </div>
    </div>
  );
};

export default MonthViewDurham;
