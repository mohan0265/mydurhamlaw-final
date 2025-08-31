// src/lib/calendar/examWindow.ts
// Expand "Exam" assessments that use a { window: { start, end } } into per-day all-day events.
// Also provide small helpers for ISO date math.

export type AnyAssessment =
  | { type: "Exam"; window?: { start: string; end: string }; weight?: number }
  | { type: "Essay"; due?: string; weight?: number }
  | { type: "Problem Question"; due?: string; weight?: number }
  | { type: string; [k: string]: any };

export type CalendarEvent = {
  id?: string;
  title: string;
  date?: string;       // yyyy-mm-dd for all-day
  start_at?: string;   // if ever timed
  end_at?: string;
  all_day?: boolean;
  meta?: Record<string, any>;
};

function toISOLocalDate(d: Date): string {
  // get local yyyy-mm-dd (no TZ shift)
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toISOLocalDate(d);
}

export function daysBetweenInclusive(startISO: string, endISO: string): string[] {
  const out: string[] = [];
  let cur = startISO;
  while (cur <= endISO) {
    out.push(cur);
    cur = addDaysISO(cur, 1);
  }
  return out;
}

export function expandExamWindowAssessments(
  moduleTitle: string,
  assessments: AnyAssessment[] | undefined
): CalendarEvent[] {
  const out: CalendarEvent[] = [];
  for (const a of assessments ?? []) {
    if (a?.type === "Exam" && a.window?.start && a.window?.end) {
      for (const day of daysBetweenInclusive(a.window.start, a.window.end)) {
        out.push({
          title: `${moduleTitle} • Exam window`,
          date: day,
          all_day: true,
          meta: { kind: "exam-window", module: moduleTitle, window: { ...a.window } },
        });
      }
      continue;
    }
    if (a?.type === "Essay" && a.due) {
      out.push({
        title: `${moduleTitle} • Essay`,
        date: a.due,
        all_day: true,
        meta: { kind: "essay-due", module: moduleTitle },
      });
    }
    if (a?.type === "Problem Question" && a.due) {
      out.push({
        title: `${moduleTitle} • Problem Question`,
        date: a.due,
        all_day: true,
        meta: { kind: "pq-due", module: moduleTitle },
      });
    }
  }
  return out;
}