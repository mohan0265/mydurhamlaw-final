// src/lib/calendar/normalize.ts
// Single normalization for Month & Week views - reads from Durham LLB plan
import { getDefaultPlanByStudentYear } from '@/data/durham/llb';
import type { YearKey } from './links';
import { format, addDays } from 'date-fns';

export type NormalizedEvent = {
  id: string;
  title: string;
  date: string;         // YYYY-MM-DD anchor date
  start?: string;       // 'HH:mm' if known
  end?: string;         // 'HH:mm' if known
  start_at?: string;    // ISO string for compatibility
  end_at?: string;      // ISO string for compatibility
  allDay: boolean;      // true for teaching & assessments without time
  kind: 'topic' | 'assessment' | 'exam';
  isWindow?: boolean;   // for exam windows
  windowStart?: string; // YYYY-MM-DD
  windowEnd?: string;   // YYYY-MM-DD
  moduleCode?: string;
  // Additional properties for compatibility
  endDate?: string;     // YYYY-MM-DD for ranged events
  subtype?: string;     // e.g., 'exam_window'
  module?: string;      // module name for display
  details?: string;     // additional details
  meta?: any;          // flexible metadata
};

export type NormalizeOptions = {
  tz?: 'Europe/London';
  clampStartISO: string; // academic year/term lower bound
  clampEndISO: string;   // academic year/term upper bound
  mode: 'year' | 'month' | 'week';
  monthStartISO?: string;
  monthEndISO?: string;
  weekStartISO?: string;
  weekEndISO?: string;
};

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

function parseISODate(d: string): Date {
  // Force midnight UTC to avoid TZ drift
  return new Date(d + 'T00:00:00.000Z');
}

function iso(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

function allowedInTerm(delivery: string, term: 'michaelmas' | 'epiphany') {
  if (term === 'michaelmas') return delivery === 'Michaelmas' || delivery === 'Michaelmas+Epiphany';
  return delivery === 'Epiphany' || delivery === 'Michaelmas+Epiphany';
}

function within(date: Date, start: Date, end: Date) {
  return date >= start && date <= end;
}

function isWithinRange(dateISO: string, startISO: string, endISO: string): boolean {
  return dateISO >= startISO && dateISO <= endISO;
}

// Read from the canonical plan in src/data/durham/llb
// Map teaching topics to their correct weekday (Mon–Fri) per existing plan logic.
// Exams/assessments with unknown times => allDay=true.
// Exam windows => emit ONE NormalizedEvent with isWindow=true, date=windowStart,
//                 windowStart, windowEnd set; DO NOT expand to daily duplicates.
// Clamp everything to academic-year + term windows here.
export function normalizeEvents(yearKey: YearKey, opts: NormalizeOptions): NormalizedEvent[] {
  const plan = getDefaultPlanByStudentYear(yearKey);
  const out: NormalizedEvent[] = [];
  const seen = new Set<string>();

  function addEvent(ev: Omit<NormalizedEvent, 'id'>) {
    const key = [ev.date, ev.kind, ev.moduleCode ?? '', ev.title ?? ''].join('|');
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ ...ev, id: key });
  }

  // Teaching weeks → distribute topics across weekdays (Mon-Fri)
  // NO teaching topics in Easter (Revision & Exams only)
  ([
    { term: 'michaelmas' as const, weeks: plan.termDates.michaelmas.weeks },
    { term: 'epiphany'   as const, weeks: plan.termDates.epiphany.weeks   },
  ]).forEach(({ term, weeks }) => {
    weeks.forEach((weekStartISO: string, weekIndex: number) => {
      const weekStart = parseISODate(weekStartISO);

      for (const mod of plan.modules ?? []) {
        if (!allowedInTerm(mod.delivery, term)) continue;

        // Try common shapes safely without depending on schema changes:
        let topic: string | undefined;
        
        // 1) module.topics[weekIndex]
        if (Array.isArray(mod?.topics) && mod.topics[weekIndex] !== undefined) {
          const t = mod.topics[weekIndex];
          if (typeof t === 'string') {
            topic = t;
          } else if (t && typeof t === 'object' && 'title' in t && typeof (t as any).title === 'string') {
            topic = (t as any).title;
          }
        }
        // 2) module.weeks[weekIndex].topic / .title (safely handle optional weeks)
        if (!topic && (mod as any)?.weeks && Array.isArray((mod as any).weeks) && (mod as any).weeks[weekIndex]) {
          const w = (mod as any).weeks[weekIndex];
          if (w && typeof w === 'object') {
            if ('topic' in w && typeof w.topic === 'string') topic = w.topic;
            else if ('title' in w && typeof w.title === 'string') topic = w.title;
          }
        }
        // 3) module[termKey]?.topics[weekIndex]
        if (!topic) {
          const termBucket = (mod as any)?.[term];
          if (termBucket?.topics && Array.isArray(termBucket.topics)) {
            const t = termBucket.topics[weekIndex];
            if (typeof t === 'string') topic = t;
            if (t && typeof t.title === 'string') topic = t.title;
          }
        }

        if (!topic) continue; // ← no weekly topic? skip to avoid bland duplicates

        // Calculate the actual day for this module (Mon=0, Tue=1, Wed=2, Thu=3, Fri=4)
        const dayOffset = dayOffsetForModule(mod.title);
        const topicDate = addDays(weekStart, dayOffset);
        const topicDateISO = iso(topicDate);

        // Clamp to requested range
        if (!isWithinRange(topicDateISO, opts.clampStartISO, opts.clampEndISO)) continue;

        // Additional filtering for month/week modes
        if (opts.mode === 'month' && opts.monthStartISO && opts.monthEndISO) {
          if (!isWithinRange(topicDateISO, opts.monthStartISO, opts.monthEndISO)) continue;
        }
        if (opts.mode === 'week' && opts.weekStartISO && opts.weekEndISO) {
          if (!isWithinRange(topicDateISO, opts.weekStartISO, opts.weekEndISO)) continue;
        }

        // We DO NOT fabricate times. These render as all-day chips.
        addEvent({
          date: topicDateISO,               // Specific weekday based on module
          title: `${mod.title}: ${topic}`,
          allDay: true,
          kind: 'topic',
          moduleCode: mod.code,
          module: mod.title,               // For display compatibility
        });
      }
    });
  });

  // Assessments (deadlines / exams) — never invent times
  for (const mod of plan.modules ?? []) {
    for (const a of mod.assessments ?? []) {
      if ('due' in a && a.due) {
        const dueISO = a.due;
        
        // Clamp to requested range
        if (!isWithinRange(dueISO, opts.clampStartISO, opts.clampEndISO)) continue;

        // Additional filtering for month/week modes
        if (opts.mode === 'month' && opts.monthStartISO && opts.monthEndISO) {
          if (!isWithinRange(dueISO, opts.monthStartISO, opts.monthEndISO)) continue;
        }
        if (opts.mode === 'week' && opts.weekStartISO && opts.weekEndISO) {
          if (!isWithinRange(dueISO, opts.weekStartISO, opts.weekEndISO)) continue;
        }

        addEvent({
          date: dueISO,
          title: `${mod.title} ${a.type}`,
          allDay: true,
          kind: 'assessment',
          moduleCode: mod.code,
          module: mod.title,               // For display compatibility
        });
      } else if ('window' in a && a.window?.start && a.type === 'Exam') {
        // Create ONE exam window event on start date; do not fabricate exact times
        const windowStartISO = a.window.start;
        const windowEndISO = a.window.end;
        
        // Clamp to requested range - only check if window start is within range
        if (!isWithinRange(windowStartISO, opts.clampStartISO, opts.clampEndISO)) continue;

        // For month/week modes, only include if the window start falls within the target range
        if (opts.mode === 'month' && opts.monthStartISO && opts.monthEndISO) {
          if (!isWithinRange(windowStartISO, opts.monthStartISO, opts.monthEndISO)) continue;
        }
        if (opts.mode === 'week' && opts.weekStartISO && opts.weekEndISO) {
          if (!isWithinRange(windowStartISO, opts.weekStartISO, opts.weekEndISO)) continue;
        }

        addEvent({
          date: windowStartISO,
          title: `${mod.title} • Exam window`,
          allDay: true,
          kind: 'exam',
          isWindow: true,
          windowStart: windowStartISO,
          windowEnd: windowEndISO,
          moduleCode: mod.code,
          module: mod.title,               // For display compatibility
          subtype: 'exam_window',          // For backward compatibility
          endDate: windowEndISO,           // For ranged events
        });
      }
    }
  }

  return out;
}