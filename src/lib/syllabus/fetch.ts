import { z } from 'zod';
import { getBrowserSupabase } from '@/lib/supabase/browser';
import { YearZ, TermZ, WeekZ, TopicZ } from './schema';

export async function getStudentYear(): Promise<1|2|3|4|null> {
  try {
    const supabase = getBrowserSupabase();
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('current_year')
      .eq('id', user.id)
      .maybeSingle();
    if (error) { console.warn('[Planner] profiles error', error); return null; }
    const n = Number(data?.current_year);
    return (n >=1 && n<=4) ? (n as 1|2|3|4) : null;
  } catch (e) {
    console.warn('[Planner] getStudentYear failed', e);
    return null;
  }
}

export async function getYear(year: number) {
  const supabase = getBrowserSupabase();
  if (!supabase) return { available: false, reason: 'missing-keys' as const };

  // Pull terms
  const { data: terms, error: te } = await supabase
    .from('syllabus_terms')
    .select('*')
    .eq('year_number', year)
    .order('start_date', { ascending: true });

  if (te) return { available: false, reason: 'query-error' as const };
  if (!terms || terms.length === 0) return { available: false, reason: 'no-data' as const };

  // For each term, pull weeks and topics
  const termObjs: any[] = [];
  for (const t of terms) {
    const { data: weeks, error: we } = await supabase
      .from('syllabus_weeks')
      .select('*')
      .eq('year_number', year)
      .eq('term_slug', t.slug)
      .order('week_no');

    if (we || !weeks) continue;

    const weekObjs: any[] = [];
    for (const w of weeks) {
      const { data: topics, error: to } = await supabase
        .from('syllabus_topics')
        .select('day, title, order_idx, ref_slug, module_code, syllabus_modules(name)')
        .eq('year_number', year)
        .eq('term_slug', t.slug)
        .eq('week_no', w.week_no)
        .order('order_idx');

      const normalized = (topics ?? []).map((row: any) => ({
        day: row.day,
        title: row.title,
        order_idx: row.order_idx ?? 0,
        ref_slug: row.ref_slug ?? undefined,
        module_code: row.module_code,
        module_name: row.syllabus_modules?.name
      }));

      const wk = { 
        week_no: w.week_no,
        start_date: w.start_date,
        end_date: w.end_date,
        topics: normalized
      };
      const parsed = WeekZ.safeParse(wk);
      if (parsed.success) weekObjs.push(parsed.data);
    }

    const tObj = {
      slug: t.slug, name: t.name,
      start_date: t.start_date, end_date: t.end_date,
      weeks: weekObjs
    };
    const parsedT = TermZ.safeParse(tObj);
    if (parsedT.success) termObjs.push(parsedT.data);
  }

  const label = `Year ${year}`;
  const yr = { label, year_number: year, terms: termObjs };
  const parsedY = YearZ.safeParse(yr);
  if (!parsedY.success) return { available: false, reason: 'parse-failed' as const };

  return { available: true as const, year: parsedY.data };
}

/** Student override creation (no effect if RLS not set or table missing) */
export async function addStudentTopic(input: {
  userId: string; year: number; term: string; week: number;
  module_code: string; day: 'Mon'|'Tue'|'Wed'|'Thu'|'Fri'; title: string; notes?: string;
}) {
  const supabase = getBrowserSupabase();
  if (!supabase) return { ok:false, reason:'missing-keys' as const };
  const { error } = await supabase.from('user_syllabus_overrides').insert({
    user_id: input.userId,
    year_number: input.year,
    term_slug: input.term,
    week_no: input.week,
    module_code: input.module_code,
    day: input.day,
    title: input.title,
    notes: input.notes ?? null
  });
  if (error) return { ok:false, reason:'insert-error' as const };
  return { ok:true as const };
}