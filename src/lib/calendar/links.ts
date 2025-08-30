// src/lib/calendar/links.ts
export type YearKey = 'foundation' | 'year1' | 'year2' | 'year3';

export const YEAR_LABEL: Record<YearKey, string> = {
  foundation: 'Foundation',
  year1: 'Year 1',
  year2: 'Year 2',
  year3: 'Year 3',
};

// Readonly tuple gives us tight literal types
export const YEAR_ORDER = ['foundation', 'year1', 'year2', 'year3'] as const;

export function isYearKey(x: string | undefined): x is YearKey {
  return x === 'foundation' || x === 'year1' || x === 'year2' || x === 'year3';
}

export function parseYearKey(q?: string): YearKey {
  if (isYearKey(q)) return q;
  return 'year1';
}

export function persistYearKey(y: YearKey) {
  try { localStorage.setItem('mdl.lastYear', y); } catch {}
}

export function readYearKey(): YearKey {
  try {
    const v = localStorage.getItem('mdl.lastYear');
    if (isYearKey(v ?? '')) return v as YearKey;
  } catch {}
  return 'year1';
}

export function hrefYear(y: YearKey) {
  return `/year-at-a-glance?y=${y}`;
}
export function hrefMonth(y: YearKey) {
  return `/year-at-a-glance/month?y=${y}`;
}
export function hrefWeek(y: YearKey) {
  return `/year-at-a-glance/week?y=${y}`;
}

export function getPrevYearKey(y: YearKey): YearKey | null {
  const idx = YEAR_ORDER.indexOf(y);
  if (idx > 0) return YEAR_ORDER[idx - 1] as YearKey;
  return null; // <- ensure null, never undefined
}

export function getNextYearKey(y: YearKey): YearKey | null {
  const idx = YEAR_ORDER.indexOf(y);
  if (idx >= 0 && idx < YEAR_ORDER.length - 1) return YEAR_ORDER[idx + 1] as YearKey;
  return null; // <- ensure null, never undefined
}

/** Student's own enrolled year (from profile or local fallback). */
export function getStudentYear(): YearKey {
  try {
    const p = localStorage.getItem('mdl.studentYear');
    if (isYearKey(p ?? '')) return p as YearKey;
  } catch {}
  return 'year1';
}

// Month helpers
export interface YM { 
  year: number; 
  month: number; // 1-12
}

export function parseYMParam(fallback: YM, q?: string): YM {
  if (!q) return fallback;
  const match = q.match(/^(\d{4})-(\d{1,2})$/);
  if (match) {
    const year = parseInt(match[1]!, 10);
    const month = parseInt(match[2]!, 10);
    if (year > 1900 && month >= 1 && month <= 12) {
      return { year, month };
    }
  }
  return fallback;
}

export function formatYM(ym: YM): string {
  return `${ym.year}-${String(ym.month).padStart(2, '0')}`;
}

export function prevYM(ym: YM): YM {
  if (ym.month === 1) {
    return { year: ym.year - 1, month: 12 };
  }
  return { year: ym.year, month: ym.month - 1 };
}

export function nextYM(ym: YM): YM {
  if (ym.month === 12) {
    return { year: ym.year + 1, month: 1 };
  }
  return { year: ym.year, month: ym.month + 1 };
}

export function hrefMonthYM(y: YearKey, ym: YM): string {
  return `/year-at-a-glance/month?y=${y}&ym=${formatYM(ym)}`;
}

// Week helpers  
export function parseWeekStartParam(fallbackISO: string, q?: string): string {
  if (!q) return fallbackISO;
  // Validate ISO date format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(q)) {
    const date = new Date(q + 'T00:00:00Z');
    if (!isNaN(date.getTime())) {
      return q;
    }
  }
  return fallbackISO;
}

export function addWeeksISO(mondayISO: string, delta: number): string {
  const date = new Date(mondayISO + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + (delta * 7));
  return date.toISOString().split('T')[0]!;
}

export function hrefWeekWS(y: YearKey, mondayISO: string): string {
  return `/year-at-a-glance/week?y=${y}&ws=${mondayISO}`;
}


export function getAcademicStartMonth(year: YearKey): number {
  // Returns month 1..12 (10 = October)
  return 10; // October for all years in 2025-26
}

export function getAcademicYearFor(year: YearKey): number {
  // Returns the calendar year for the academic start (2025 for 2025-26)
  return 2025;
}
