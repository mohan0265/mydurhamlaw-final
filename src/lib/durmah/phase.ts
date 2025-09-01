// src/lib/durmah/phase.ts
export type KeyDates = {
  induction: string;
  michaelmasStart: string;
  michaelmasEnd: string;
  epiphanyStart: string;
  epiphanyEnd: string;
  easterStart: string;
  easterEnd: string;
};
export type AcademicPhase =
  | 'pre_induction' | 'induction_week'
  | 'michaelmas' | 'vacation'
  | 'epiphany' | 'easter' | 'exams';
export function todayISOInTZ(timeZone: string = 'Europe/London'): string {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
  return fmt.format(new Date());
}
export function parseISODate(d: string): Date { const [y,m,day]=d.split('-').map(Number); return new Date(y,m-1,day); }
export function daysBetween(aISO: string, bISO: string): number {
  const a=parseISODate(aISO); const b=parseISODate(bISO);
  return Math.floor((b.getTime()-a.getTime())/(24*3600*1000));
}
export function computeNowPhase(nowISO: string, key: KeyDates): AcademicPhase {
  const n=nowISO; const { induction, michaelmasStart, michaelmasEnd, epiphanyStart, epiphanyEnd, easterStart, easterEnd } = key;
  if (n < induction) return 'pre_induction';
  if (n >= induction && n < michaelmasStart) return 'induction_week';
  if (n >= michaelmasStart && n <= michaelmasEnd) return 'michaelmas';
  if (n > michaelmasEnd && n < epiphanyStart) return 'vacation';
  if (n >= epiphanyStart && n <= epiphanyEnd) return 'epiphany';
  if (n > epiphanyEnd && n < easterStart) return 'vacation';
  if (n >= easterStart && n <= easterEnd) {
    const examStartISO = toISO(addDays(parseISODate(easterEnd), -30));
    return n >= examStartISO ? 'exams' : 'easter';
  }
  return 'vacation';
}
export function toISO(d: Date): string {
  const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), day=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
export function addDays(d: Date, days: number): Date { const dd=new Date(d); dd.setDate(dd.getDate()+days); return dd; }
export function formatTodayForDisplay(tz: string = 'Europe/London', locale: string = undefined as any): string {
  const fmt = new Intl.DateTimeFormat(locale || undefined, { timeZone: tz, day: 'numeric', month: 'short' });
  return fmt.format(new Date());
}
export const KEY_DATES_2025_26: KeyDates = {
  induction: '2025-09-29',
  michaelmasStart: '2025-10-06',
  michaelmasEnd: '2025-12-12',
  epiphanyStart: '2026-01-12',
  epiphanyEnd: '2026-03-20',
  easterStart: '2026-04-27',
  easterEnd: '2026-06-26',
};
export function computeDaysUntil(nowISO: string, key: KeyDates) {
  return { induction: Math.max(0, daysBetween(nowISO, key.induction)),
           teachingStart: Math.max(0, daysBetween(nowISO, key.michaelmasStart)) };
}
export function defaultMonthDeepLink(yearKey: 'foundation'|'year1'|'year2'|'year3', nowISO: string, key: KeyDates) {
  const preInduction = nowISO < key.induction; const ym = preInduction ? '2025-10' : `${nowISO.slice(0,7)}`;
  return `/year-at-a-glance/month?y=${yearKey}&ym=${ym}`;
}
export function weekOneLink(yearKey: 'foundation'|'year1'|'year2'|'year3', key: KeyDates) {
  return `/year-at-a-glance/week?y=${yearKey}&start=${key.michaelmasStart}`;
}
