export function fmtRange(startISO: string, endISO: string) {
  const s = new Date(startISO);
  const e = new Date(endISO);
  const opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: '2-digit' };
  return `${s.toLocaleDateString(undefined, opts)} → ${e.toLocaleDateString(undefined, opts)}`;
}
export function addDaysISO(iso: string, days: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear(), m = `${d.getMonth()+1}`.padStart(2,'0'), da = `${d.getDate()}`.padStart(2,'0');
  return `${y}-${m}-${da}`;
}