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

/** Student’s own enrolled year (from profile or local fallback). */
export function getStudentYear(): YearKey {
  try {
    const p = localStorage.getItem('mdl.studentYear');
    if (isYearKey(p ?? '')) return p as YearKey;
  } catch {}
  return 'year1';
}
