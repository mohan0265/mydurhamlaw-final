// src/lib/supabase/supabaseBridge.ts
import { KEY_DATES_2025_26, computeDaysUntil, computeNowPhase, todayISOInTZ } from '../durmah/phase';
import type { MDLStudentContext, YearKey } from '../durmah/context';
export { supabase } from './supabase-browser';
export { useAuth } from '@/lib/supabase/AuthContext';
type MinimalUser = { id: string; user_metadata?: Record<string, any>; };
function deriveFirstName(meta?: Record<string, any>) { return (meta?.first_name || meta?.firstName || meta?.name || 'there') as string; }
function deriveYearKey(meta?: Record<string, any>): YearKey {
  const v = (meta?.yearKey || meta?.year || 'year1') as string;
  return (v === 'foundation' || v === 'year1' || v === 'year2' || v === 'year3') ? v : 'year1';
}
export async function loadMDLStudentContext(user?: MinimalUser): Promise<MDLStudentContext> {
  let u = user;
  try {
    const { supabase } = await import('./supabase-browser');
    if (!u) { const { data } = await supabase.auth.getSession(); u = data?.session?.user as any; }
  } catch {}
  const firstName = u ? deriveFirstName(u.user_metadata) : 'there';
  const yearKey = u ? deriveYearKey(u.user_metadata) : 'year1';
  const userId = u?.id || ''; const timezone = 'Europe/London' as const; const keyDates = KEY_DATES_2025_26;
  const nowISO = todayISOInTZ(timezone); const daysUntil = computeDaysUntil(nowISO, keyDates); const nowPhase = computeNowPhase(nowISO, keyDates);
  const ctx: MDLStudentContext = { userId, firstName, university: 'Durham University', programme: 'LLB', yearKey, academicYear: '2025/26', timezone, keyDates, modules: [], nowPhase, daysUntil, hydrated: true };
  if (typeof window !== 'undefined') (window as any).__mdlStudentContext = ctx; return ctx;
}
