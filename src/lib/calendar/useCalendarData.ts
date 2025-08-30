// src/lib/calendar/useCalendarData.ts
import { useMemo } from 'react';
import { 
  startOfWeek, 
  endOfWeek, 
  format, 
  addDays,
  startOfMonth,
  endOfMonth
} from 'date-fns';
import { DURHAM_LLB_2025_26, getDefaultPlanByStudentYear } from '@/data/durham/llb';
import type { YearKey, YM } from './links';

// Helper functions to replace missing date-fns exports
function parseISO(dateString: string): Date {
  return new Date(dateString + 'T00:00:00.000Z');
}

function isWithinInterval(date: Date, interval: { start: Date; end: Date }): boolean {
  return date >= interval.start && date <= interval.end;
}

export interface CalendarEvent {
  id: string;
  year: YearKey;
  date: string;          // ISO 'YYYY-MM-DD'
  start?: string;        // 'HH:mm' (optional for month dots)
  end?: string;          // 'HH:mm'
  kind: 'lecture' | 'seminar' | 'deadline' | 'exam' | 'task' | 'routine';
  module?: string;       // e.g., 'Tort Law'
  title: string;         // e.g., 'Tort: Duty of Care'
  details?: string;      // optional tooltip text
}

export function getAcademicStartMonth(year: YearKey): number {
  // Returns 0-based month (9 = October)
  return 9; // October for all years in 2025-26
}

export function loadEventsForYear(year: YearKey): CalendarEvent[] {
  const plan = getDefaultPlanByStudentYear(year);
  const events: CalendarEvent[] = [];
  let eventId = 0;

  // Add routine events for teaching weeks
  const allWeeks = [
    ...plan.termDates.michaelmas.weeks,
    ...plan.termDates.epiphany.weeks,
    ...plan.termDates.easter.weeks,
  ];

  // Add routine events for each teaching week (lectures/seminars)
  allWeeks.forEach((weekStart) => {
    plan.modules.forEach((module) => {
      // Generate lecture events (Mon, Wed, Fri for full-year modules)
      if (module.delivery === 'Michaelmas+Epiphany' || module.delivery === 'Michaelmas') {
        const weekStartDate = parseISO(weekStart);
        
        // Only add lectures for appropriate terms
        const isMichaelmas = plan.termDates.michaelmas.weeks.includes(weekStart);
        const isEpiphany = plan.termDates.epiphany.weeks.includes(weekStart);
        
        if ((module.delivery === 'Michaelmas' && isMichaelmas) ||
            (module.delivery === 'Michaelmas+Epiphany' && (isMichaelmas || isEpiphany))) {
          
          // Monday lecture
          events.push({
            id: `lec-${eventId++}`,
            year,
            date: format(weekStartDate, 'yyyy-MM-dd'),
            start: '10:00',
            end: '11:00',
            kind: 'lecture',
            module: module.title,
            title: `${module.title} Lecture`,
            details: `Code: ${module.code || 'N/A'}`
          });

          // Wednesday lecture
          events.push({
            id: `lec-${eventId++}`,
            year,
            date: format(addDays(weekStartDate, 2), 'yyyy-MM-dd'),
            start: '14:00',
            end: '15:00',
            kind: 'lecture',
            module: module.title,
            title: `${module.title} Lecture`,
            details: `Code: ${module.code || 'N/A'}`
          });

          // Friday seminar
          events.push({
            id: `sem-${eventId++}`,
            year,
            date: format(addDays(weekStartDate, 4), 'yyyy-MM-dd'),
            start: '11:00',
            end: '12:00',
            kind: 'seminar',
            module: module.title,
            title: `${module.title} Seminar`,
            details: `Tutorial and discussion`
          });
        }
      }
    });
  });

  // Add assessment deadlines
  plan.modules.forEach((module) => {
    module.assessments.forEach((assessment) => {
      if ('due' in assessment) {
        events.push({
          id: `deadline-${eventId++}`,
          year,
          date: assessment.due,
          kind: 'deadline',
          module: module.title,
          title: `${module.title} ${assessment.type}`,
          details: `Weight: ${assessment.weight || 'N/A'}%`
        });
      } else if ('window' in assessment) {
        events.push({
          id: `exam-${eventId++}`,
          year,
          date: assessment.window.start,
          start: '09:00',
          end: '12:00',
          kind: 'exam',
          module: module.title,
          title: `${module.title} Exam`,
          details: `Exam period: ${assessment.window.start} - ${assessment.window.end}`
        });
      }
    });
  });

  // Add some routine events for better UX
  allWeeks.forEach((weekStart) => {
    const weekStartDate = parseISO(weekStart);
    
    // Weekly study planning (Sunday)
    events.push({
      id: `routine-${eventId++}`,
      year,
      date: format(addDays(weekStartDate, 6), 'yyyy-MM-dd'),
      start: '18:00',
      end: '19:00',
      kind: 'routine',
      title: 'Weekly Planning',
      details: 'Review upcoming week and prepare study schedule'
    });
  });

  return events;
}

export function getEventsForMonth(year: YearKey, ym: YM): CalendarEvent[] {
  const allEvents = loadEventsForYear(year);
  const monthStart = startOfMonth(new Date(ym.year, ym.month - 1));
  const monthEnd = endOfMonth(monthStart);

  return allEvents.filter(event => {
    const eventDate = parseISO(event.date);
    return isWithinInterval(eventDate, { start: monthStart, end: monthEnd });
  });
}

export function getEventsForWeek(year: YearKey, weekStartISO: string): CalendarEvent[] {
  const allEvents = loadEventsForYear(year);
  const weekStart = parseISO(weekStartISO);
  const weekEnd = addDays(weekStart, 6);

  return allEvents.filter(event => {
    const eventDate = parseISO(event.date);
    return isWithinInterval(eventDate, { start: weekStart, end: weekEnd });
  });
}

// Hook for month data
export function useMonthData(year: YearKey, ym: YM) {
  return useMemo(() => {
    return getEventsForMonth(year, ym);
  }, [year, ym.year, ym.month]);
}

// Hook for week data  
export function useWeekData(year: YearKey, weekStartISO: string) {
  return useMemo(() => {
    return getEventsForWeek(year, weekStartISO);
  }, [year, weekStartISO]);
}