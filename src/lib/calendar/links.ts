// src/lib/calendar/links.ts
export type YearKey = 'foundation' | 'year1' | 'year2' | 'year3';

export const YEAR_LABEL: Record<YearKey, string> = {
  foundation: 'Foundation',
  year1: 'Year 1',
  year2: 'Year 2',
  year3: 'Year 3',
};

const ORDER: YearKey[] = ['foundation', 'year1', 'year2', 'year3'];

export function parseYearKey(input?: unknown): YearKey {
  const raw =
    typeof input === 'string' ? input :
    Array.isArray(input) && input.length ? input[0] :
    typeof window !== 'undefined' ? window.localStorage.getItem('yaag:y') : null;

  const v = (raw || '').toLowerCase().trim();
  if (v === 'foundation' || v === 'year1' || v === 'year2' || v === 'year3') return v;
  return 'year1';
}

export function persistYearKey(y: YearKey): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('yaag:y', y);
  }
}

export function readYearKey(): YearKey | null {
  if (typeof window === 'undefined') return null;
  const v = window.localStorage.getItem('yaag:y');
  return v ? parseYearKey(v) : null;
}

export function hrefYear(y: YearKey): string {
  return `/year-at-a-glance?y=${y}`;
}
export function hrefMonth(y: YearKey): string {
  return `/year-at-a-glance/month?y=${y}`;
}
export function hrefWeek(y: YearKey, w?: string | number): string {
  const qs = new URLSearchParams({ y });
  if (typeof w !== 'undefined') qs.set('w', String(w));
  return `/year-at-a-glance/week?${qs.toString()}`;
}

export function getPrevYearKey(current: YearKey): YearKey {
  const i = ORDER.indexOf(current);
  return i > 0 ? ORDER[i - 1]! : ORDER[0]!;
}
export function getNextYearKey(current: YearKey): YearKey {
  const i = ORDER.indexOf(current);
  return i < ORDER.length - 1 ? ORDER[i + 1]! : ORDER[ORDER.length - 1]!;
}