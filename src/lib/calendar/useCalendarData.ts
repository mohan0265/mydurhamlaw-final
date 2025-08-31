// src/lib/calendar/useCalendarData.ts
import { useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  format,
  addDays,
} from 'date-fns';
import { getDefaultPlanByStudentYear } from '@/data/durham/llb';
import type { YearKey } from './links';

// Map module families to stable weekdays (0=Mon..4=Fri)
const MODULE_DAY_MAP: Record<string, number> = {
  'Tort': 0,                             // Mon
  'Contract': 1,                         // Tue
  'European Union': 2,                   // Wed
  'UK Constitutional': 3,                // Thu
  'Introduction to English Law': 4,      // Fri
};

function dayOffsetForModule(title: string): number {
  const key = Object.keys(MODULE_DAY_MAP).find(k => title.includes(k));
  return key ? MODULE_DAY_MAP[key]! : 0; // default Monday
}

export type EventKind = 'lecture' | 'seminar' | 'deadline' | 'exam' | 'assessment' | 'task' | 'all-day';

export interface CalendarEvent {
  id: string;
  year: YearKey;
  date: string;        // 'YYYY-MM-DD' (start date for events)
  endDate?: string;    // 'YYYY-MM-DD' (end date for ranged events)
  start?: string;      // 'HH:mm' (ONLY if present in data)
  end?: string;        // 'HH:mm'
  kind: EventKind;
  subtype?: string;    // e.g., 'exam_window'
  allDay?: boolean;    // true for all-day events
  module?: string;     // e.g., 'Tort Law'
  moduleCode?: string; // e.g., 'TORT'
  title: string;       // Prefer weekly topic/subtopic; fallback to safe label
  details?: string;
}

export interface YM { year: number; month: number } // month: 1..12

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

// ───────────────────────────────────────────────────────────────────────────────
// helpers
// ───────────────────────────────────────────────────────────────────────────────

const cache = new Map<YearKey, CalendarEvent[]>();

function parseISODate(d: string) {
  // Force midnight UTC to avoid TZ drift
  return new Date(d + 'T00:00:00.000Z');
}

function iso(d: Date) {
  return format(d, 'yyyy-MM-dd');
}

function within(date: Date, start: Date, end: Date) {
  return date >= start && date <= end;
}

/** Pick a weekly topic string if the plan exposes one; otherwise undefined. */
function topicForWeek(
  module: any,
  termKey: 'michaelmas' | 'epiphany',
  weekIndex: number
): string | undefined {
  // Try common shapes safely without depending on schema changes:
  // 1) module.topics[weekIndex]
  if (Array.isArray(module?.topics) && module.topics[weekIndex]) {
    const t = module.topics[weekIndex];
    if (typeof t === 'string') return t;
    if (t && typeof t.title === 'string') return t.title;
  }
  // 2) module.weeks[weekIndex].topic / .title
  if (Array.isArray(module?.weeks) && module.weeks[weekIndex]) {
    const w = module.weeks[weekIndex];
    if (typeof w?.topic === 'string') return w.topic;
    if (typeof w?.title === 'string') return w.title;
  }
  // 3) module[termKey]?.topics[weekIndex]
  const termBucket = module?.[termKey];
  if (termBucket?.topics && Array.isArray(termBucket.topics)) {
    const t = termBucket.topics[weekIndex];
    if (typeof t === 'string') return t;
    if (t && typeof t.title === 'string') return t.title;
  }
  return undefined;
}

function allowedInTerm(delivery: string, term: 'michaelmas' | 'epiphany') {
  if (term === 'michaelmas') return delivery === 'Michaelmas' || delivery === 'Michaelmas+Epiphany';
  return delivery === 'Epiphany' || delivery === 'Michaelmas+Epiphany';
}

function addEvent(out: CalendarEvent[], seen: Set<string>, ev: Omit<CalendarEvent, 'id'>) {
  const key = [ev.year, ev.date, ev.kind, ev.module ?? '', ev.title ?? ''].join('|');
  if (seen.has(key)) return;
  seen.add(key);
  out.push({ ...ev, id: key });
}

// ───────────────────────────────────────────────────────────────────────────────
// public API
// ───────────────────────────────────────────────────────────────────────────────

export function getAcademicStartMonth(_y: YearKey): number { return 10; } // October
export function getAcademicYearFor(_y: YearKey): number { return 2025; } // 2025/26 AY

export function loadEventsForYear(y: YearKey): CalendarEvent[] {
  if (cache.has(y)) return cache.get(y)!;

  const plan = getDefaultPlanByStudentYear(y);
  if (process.env.NODE_ENV !== 'production') {
  const rows = (plan.modules ?? []).map((m: any) => ({
    module: m.title || m.name,
    delivery: m.delivery,           // 'Michaelmas' | 'Epiphany' | 'Michaelmas+Epiphany'
    micTopics: (m?.michaelmas?.topics?.length) || (Array.isArray(m?.topics) ? m.topics.length : 0) || 0,
    epiTopics: (m?.epiphany?.topics?.length) || 0,
    exams: (m?.assessments?.filter((a: any) => 'window' in a)?.length) || 0,
    deadlines: (m?.assessments?.filter((a: any) => 'due' in a)?.length) || 0,
  }));
  // eslint-disable-next-line no-console
  console.table(rows);
}

  const out: CalendarEvent[] = [];
  const seen = new Set<string>();

  // Teaching weeks → distribute topics across weekdays (Mon-Fri)
  ([
    { term: 'michaelmas' as const, weeks: plan.termDates.michaelmas.weeks },
    { term: 'epiphany'   as const, weeks: plan.termDates.epiphany.weeks   },
  ]).forEach(({ term, weeks }) => {
    weeks.forEach((weekStartISO: string, weekIndex: number) => {
      const weekStart = parseISODate(weekStartISO);

      for (const mod of plan.modules ?? []) {
        if (!allowedInTerm(mod.delivery, term)) continue;

        const topic = topicForWeek(mod, term, weekIndex);
        if (!topic) continue; // ← no weekly topic? skip to avoid bland duplicates

        // Calculate the actual day for this module (Mon=0, Tue=1, Wed=2, Thu=3, Fri=4)
        const dayOffset = dayOffsetForModule(mod.title);
        const topicDate = addDays(weekStart, dayOffset);

        // We DO NOT fabricate times. These render as all-day chips.
        addEvent(out, seen, {
          year: y,
          date: iso(topicDate),               // Specific weekday based on module
          kind: 'lecture',
          module: mod.title,
          title: `${mod.title}: ${topic}`,
          details: `W${weekIndex + 1}`,
        });
      }
    });
  });

  // Assessments (deadlines / exams) — never invent times
  for (const mod of plan.modules ?? []) {
    for (const a of mod.assessments ?? []) {
      if ('due' in a && a.due) {
        addEvent(out, seen, {
          year: y,
          date: a.due,
          kind: 'deadline',
          module: mod.title,
          title: `${mod.title} ${a.type}`,
          details: a.weight ? `Weight: ${a.weight}%` : undefined,
        });
      } else if ('window' in a && a.window?.start && a.type === 'Exam') {
        // Create ONE ranged all-day banner per module; do not fabricate exact times
        addEvent(out, seen, {
          year: y,
          date: a.window.start,
          endDate: a.window.end,
          allDay: true,
          kind: 'assessment',
          subtype: 'exam_window',
          module: mod.title,
          moduleCode: mod.code,
          title: `${mod.title} • Exam window`,
          details: a.window.end ? `Exam window: ${a.window.start} – ${a.window.end}` : undefined,
        });
      }
    }
  }

  cache.set(y, out);
  return out;
}

export function getEventsForMonth(y: YearKey, ym: YM): CalendarEvent[] {
  const all = loadEventsForYear(y);
  const start = startOfMonth(new Date(ym.year, ym.month - 1, 1));
  const end = endOfMonth(start);
  return all.filter(e => {
    const d = parseISODate(e.date);
    return within(d, start, end);
  });
}

export function getEventsForWeek(y: YearKey, mondayISO: string): CalendarEvent[] {
  const all = loadEventsForYear(y);
  const weekStart = parseISODate(mondayISO);
  const weekEnd = addDays(weekStart, 6);
  return all.filter(e => {
    const d = parseISODate(e.date);
    return within(d, weekStart, weekEnd);
  });
}

// Year columns (Michaelmas/Epiphany/Easter) built from real events:
export function buildYearPlanFromData(y: YearKey): YearPlan {
  const plan = getDefaultPlanByStudentYear(y);
  const all = loadEventsForYear(y);

  function termBlock(term: 'michaelmas' | 'epiphany' | 'easter', title: string, dangerKinds: EventKind[]) {
    const termDates = plan.termDates[term];
    return {
      key: term,
      title,
      dateRangeLabel: `${format(parseISODate(termDates.start), 'd MMM')} – ${format(parseISODate(termDates.end), 'd MMM')}`,
      modules:
        term === 'easter'
          ? [] // usually revision/exams only
          : (plan.modules ?? [])
              .filter(m => allowedInTerm(m.delivery, term as any))
              .map(m => m.title),
      weeks: termDates.weeks.map((wISO: string, i: number) => {
        const ws = parseISODate(wISO);
        const we = addDays(ws, 6);
        const deadlines = all
          .filter(e => e.kind === 'deadline' || e.kind === 'exam')
          .filter(e => {
            const d = parseISODate(e.date);
            return within(d, ws, we);
          })
          .map(e => ({
            label: `${e.module} • ${e.kind === 'exam' ? 'Exam' : e.title.replace(`${e.module} `, '')}`,
            danger: dangerKinds.includes(e.kind),
          }));
        return {
          id: `W${i + 1}`,
          dateLabel: format(ws, 'd MMM'),
          deadlines,
        };
      }),
    };
  }

  return {
    terms: [
      termBlock('michaelmas', 'Michaelmas', ['exam']),
      termBlock('epiphany', 'Epiphany', ['exam']),
      termBlock('easter', 'Easter (Revision & Exams)', ['exam']),
    ],
  };
}

// Tiny hooks
export function useMonthData(y: YearKey, ym: YM) {
  return useMemo(() => getEventsForMonth(y, ym), [y, ym.year, ym.month]);
}
export function useWeekData(y: YearKey, mondayISO: string) {
  return useMemo(() => getEventsForWeek(y, mondayISO), [y, mondayISO]);
}
export function useYearPlan(y: YearKey) {
  return useMemo(() => buildYearPlanFromData(y), [y]);
}
