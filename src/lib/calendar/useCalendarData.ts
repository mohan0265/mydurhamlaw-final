// src/lib/calendar/useCalendarData.ts
import { useMemo } from 'react';
import { 
  startOfMonth, 
  endOfMonth, 
  format, 
  addDays, 
  addWeeks,
  startOfWeek,
  isSameMonth
} from 'date-fns';
import { DURHAM_LLB_2025_26, getDefaultPlanByStudentYear } from '@/data/durham/llb';
import type { YearKey } from './links';

export type EventKind = 'lecture' | 'seminar' | 'deadline' | 'exam' | 'task' | 'all-day';

export interface CalendarEvent {
  id: string;
  year: YearKey;
  date: string;        // 'YYYY-MM-DD'
  start?: string;      // 'HH:mm' (optional)
  end?: string;        // 'HH:mm' (optional)
  kind: EventKind;
  module?: string;     // e.g., 'Tort Law'
  title: string;       // e.g., 'Duty of Care'
  details?: string;    // optional
}

export interface YM { 
  year: number; 
  month: number; // month: 1..12
}

export interface YearPlan {
  terms: Array<{
    key: 'michaelmas' | 'epiphany' | 'easter';
    title: string;
    dateRangeLabel: string; // e.g., '6 Oct – 12 Dec'
    modules: string[];
    weeks: Array<{
      id: string;           // 'W1'
      dateLabel?: string;   // '6 Oct'
      deadlines: Array<{ label: string; danger?: boolean }>;
    }>;
  }>;
}

// Cache for computed events per year
const eventCache = new Map<YearKey, CalendarEvent[]>();

export function getAcademicStartMonth(y: YearKey): number {
  // Returns month 1..12 (10 = October)
  return 10;
}

export function getAcademicYearFor(y: YearKey): number {
  // For 2025/26 academic year
  return 2025;
}

// Helper to compute Monday of a given week within term
function computeWeekMonday(termStartWeeks: string[], weekIndex: number): string {
  if (weekIndex < termStartWeeks.length) {
    return termStartWeeks[weekIndex]!;
  }
  // Fallback: compute from first week
  const firstWeek = termStartWeeks[0];
  if (firstWeek) {
    const firstDate = new Date(firstWeek + 'T00:00:00.000Z');
    const targetDate = addWeeks(firstDate, weekIndex);
    return format(targetDate, 'yyyy-MM-dd');
  }
  return '2025-10-06'; // Safe fallback
}

// Helper to parse ISO date safely
function parseISODate(dateString: string): Date {
  return new Date(dateString + 'T00:00:00.000Z');
}

// Helper to check if date is within interval
function isDateWithinInterval(date: Date, interval: { start: Date; end: Date }): boolean {
  return date >= interval.start && date <= interval.end;
}

export function loadEventsForYear(y: YearKey): CalendarEvent[] {
  // Check cache first
  if (eventCache.has(y)) {
    return eventCache.get(y)!;
  }

  const plan = getDefaultPlanByStudentYear(y);
  const events: CalendarEvent[] = [];
  let eventId = 0;

  // Generate regular teaching events for each term
  const termConfigs = [
    { key: 'michaelmas' as const, weeks: plan.termDates.michaelmas.weeks },
    { key: 'epiphany' as const, weeks: plan.termDates.epiphany.weeks }
  ];

  termConfigs.forEach(({ key: termKey, weeks }) => {
    weeks.forEach((weekStart, weekIndex) => {
      const weekStartDate = parseISODate(weekStart);
      
      plan.modules.forEach((module) => {
        const isModuleInTerm = 
          (termKey === 'michaelmas' && (module.delivery === 'Michaelmas' || module.delivery === 'Michaelmas+Epiphany')) ||
          (termKey === 'epiphany' && (module.delivery === 'Epiphany' || module.delivery === 'Michaelmas+Epiphany'));

        if (isModuleInTerm) {
          // Monday lecture
          events.push({
            id: `lec-${eventId++}`,
            year: y,
            date: format(weekStartDate, 'yyyy-MM-dd'),
            start: '10:00',
            end: '11:00',
            kind: 'lecture',
            module: module.title,
            title: `${module.title} Lecture`,
            details: `Week ${weekIndex + 1} - ${module.code || 'N/A'}`
          });

          // Wednesday lecture  
          events.push({
            id: `lec-${eventId++}`,
            year: y,
            date: format(addDays(weekStartDate, 2), 'yyyy-MM-dd'),
            start: '14:00',
            end: '15:00',
            kind: 'lecture',
            module: module.title,
            title: `${module.title} Lecture`,
            details: `Week ${weekIndex + 1} - ${module.code || 'N/A'}`
          });

          // Friday seminar
          events.push({
            id: `sem-${eventId++}`,
            year: y,
            date: format(addDays(weekStartDate, 4), 'yyyy-MM-dd'),
            start: '11:00',
            end: '12:00',
            kind: 'seminar',
            module: module.title,
            title: `${module.title} Seminar`,
            details: `Week ${weekIndex + 1} - Tutorial and discussion`
          });
        }
      });
    });
  });

  // Add assessment deadlines and exams
  plan.modules.forEach((module) => {
    module.assessments.forEach((assessment) => {
      if ('due' in assessment && assessment.due) {
        const assessmentDate = assessment.due;
        events.push({
          id: `deadline-${eventId++}`,
          year: y,
          date: assessmentDate,
          kind: 'deadline',
          module: module.title,
          title: `${module.title} ${assessment.type}`,
          details: `Due date - Weight: ${assessment.weight || 'N/A'}%`
        });
      } else if ('window' in assessment && assessment.window) {
        // Add exam as an all-day event on the start of the window
        events.push({
          id: `exam-${eventId++}`,
          year: y,
          date: assessment.window.start,
          kind: 'exam',
          module: module.title,
          title: `${module.title} Exam`,
          details: `Exam period: ${assessment.window.start} - ${assessment.window.end}`
        });
      }
    });
  });

  // Add some routine planning events for better UX
  const allTeachingWeeks = [
    ...plan.termDates.michaelmas.weeks,
    ...plan.termDates.epiphany.weeks
  ];

  allTeachingWeeks.forEach((weekStart, index) => {
    if (index % 2 === 0) { // Every other week
      const sundayDate = addDays(parseISODate(weekStart), 6);
      events.push({
        id: `routine-${eventId++}`,
        year: y,
        date: format(sundayDate, 'yyyy-MM-dd'),
        start: '18:00',
        end: '19:00',
        kind: 'task',
        title: 'Weekly Planning',
        details: 'Review upcoming week and prepare study schedule'
      });
    }
  });

  // Cache the results
  eventCache.set(y, events);
  return events;
}

export function getEventsForMonth(y: YearKey, ym: YM): CalendarEvent[] {
  const allEvents = loadEventsForYear(y);
  const monthStart = startOfMonth(new Date(ym.year, ym.month - 1));
  const monthEnd = endOfMonth(monthStart);

  return allEvents.filter(event => {
    const eventDate = parseISODate(event.date);
    return isDateWithinInterval(eventDate, { start: monthStart, end: monthEnd });
  });
}

export function getEventsForWeek(y: YearKey, mondayISO: string): CalendarEvent[] {
  const allEvents = loadEventsForYear(y);
  const weekStart = parseISODate(mondayISO);
  const weekEnd = addDays(weekStart, 6);

  return allEvents.filter(event => {
    const eventDate = parseISODate(event.date);
    return isDateWithinInterval(eventDate, { start: weekStart, end: weekEnd });
  });
}

export function buildYearPlanFromData(y: YearKey): YearPlan {
  const plan = getDefaultPlanByStudentYear(y);
  const allEvents = loadEventsForYear(y);
  
  return {
    terms: [
      {
        key: 'michaelmas',
        title: 'Michaelmas',
        dateRangeLabel: `${format(parseISODate(plan.termDates.michaelmas.start), 'd MMM')} – ${format(parseISODate(plan.termDates.michaelmas.end), 'd MMM')}`,
        modules: plan.modules
          .filter(m => m.delivery === 'Michaelmas' || m.delivery === 'Michaelmas+Epiphany')
          .map(m => m.title),
        weeks: plan.termDates.michaelmas.weeks.map((weekStart, index) => {
          const weekStartDate = parseISODate(weekStart);
          const weekEvents = allEvents.filter(event => {
            const eventDate = parseISODate(event.date);
            const weekEnd = addDays(weekStartDate, 6);
            return isDateWithinInterval(eventDate, { start: weekStartDate, end: weekEnd }) && 
                   event.kind === 'deadline';
          });
          
          return {
            id: `W${index + 1}`,
            dateLabel: format(weekStartDate, 'd MMM'),
            deadlines: weekEvents.map(event => ({
              label: `${event.module} • ${event.title.replace(event.module + ' ', '')}`,
              danger: event.kind === 'exam'
            }))
          };
        })
      },
      {
        key: 'epiphany',
        title: 'Epiphany',
        dateRangeLabel: `${format(parseISODate(plan.termDates.epiphany.start), 'd MMM')} – ${format(parseISODate(plan.termDates.epiphany.end), 'd MMM')}`,
        modules: plan.modules
          .filter(m => m.delivery === 'Epiphany' || m.delivery === 'Michaelmas+Epiphany')
          .map(m => m.title),
        weeks: plan.termDates.epiphany.weeks.map((weekStart, index) => {
          const weekStartDate = parseISODate(weekStart);
          const weekEvents = allEvents.filter(event => {
            const eventDate = parseISODate(event.date);
            const weekEnd = addDays(weekStartDate, 6);
            return isDateWithinInterval(eventDate, { start: weekStartDate, end: weekEnd }) && 
                   event.kind === 'deadline';
          });
          
          return {
            id: `W${index + 1}`,
            dateLabel: format(weekStartDate, 'd MMM'),
            deadlines: weekEvents.map(event => ({
              label: `${event.module} • ${event.title.replace(event.module + ' ', '')}`,
              danger: event.kind === 'exam'
            }))
          };
        })
      },
      {
        key: 'easter',
        title: 'Easter (Revision & Exams)',
        dateRangeLabel: `${format(parseISODate(plan.termDates.easter.start), 'd MMM')} – ${format(parseISODate(plan.termDates.easter.end), 'd MMM')}`,
        modules: [],
        weeks: plan.termDates.easter.weeks.map((weekStart, index) => {
          const weekStartDate = parseISODate(weekStart);
          const examEvents = allEvents.filter(event => {
            const eventDate = parseISODate(event.date);
            const weekEnd = addDays(weekStartDate, 6);
            return isDateWithinInterval(eventDate, { start: weekStartDate, end: weekEnd }) && 
                   event.kind === 'exam';
          });
          
          return {
            id: `W${index + 1}`,
            dateLabel: format(weekStartDate, 'd MMM'),
            deadlines: examEvents.map(event => ({
              label: `${event.module} • Exam`,
              danger: true
            }))
          };
        })
      }
    ]
  };
}

// React hooks for easier component integration
export function useMonthData(y: YearKey, ym: YM) {
  return useMemo(() => getEventsForMonth(y, ym), [y, ym.year, ym.month]);
}

export function useWeekData(y: YearKey, mondayISO: string) {
  return useMemo(() => getEventsForWeek(y, mondayISO), [y, mondayISO]);
}

export function useYearPlan(y: YearKey) {
  return useMemo(() => buildYearPlanFromData(y), [y]);
}