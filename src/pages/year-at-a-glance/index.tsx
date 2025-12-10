// src/pages/year-at-a-glance/index.tsx
import React, { useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  YearKey,
  YEAR_LABEL,
  hrefYear,
  hrefMonth,
  hrefWeek,
  parseYearKey,
  persistYearKey,
  getPrevYearKey,
  getNextYearKey,
} from '@/lib/calendar/links';
import { buildYearPlanFromData } from '@/lib/calendar/useCalendarData';
import { normalizeEvents } from '@/lib/calendar/normalize';
import { getDefaultPlanByStudentYear } from '@/data/durham/llb';
import { useStudentProfile } from '@/lib/hooks/useStudentProfile';
import { format, addDays } from 'date-fns';
import { useAuth } from '@/lib/supabase/AuthContext';
import { getSupabaseClient } from '@/lib/supabase/client';

// ----- small pills -----
function Pill({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-purple-50 text-purple-800 text-xs px-2 py-1 border border-purple-100">
      {text}
    </span>
  );
}
function DangerPill({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-red-50 text-red-700 text-xs px-2 py-1 border border-red-100">
      {text}
    </span>
  );
}
function PersonalPill({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 text-xs px-2 py-1 border border-emerald-100">
      {text}
    </span>
  );
}

// ----- local types -----
// Extend the base deadline type to include isPersonal and id for linking
type ExtendedDeadline = { label: string; danger?: boolean; isPersonal?: boolean; id?: string };

type WeekRow = { 
  id: string; 
  dateLabel?: string; 
  mondayISO?: string; 
  deadlines: ExtendedDeadline[] 
};

type TermCard = {
  key: 'michaelmas' | 'epiphany' | 'easter';
  title: string;
  dateRangeLabel: string;
  modules: string[];
  weeks: WeekRow[];
};

type PersonalAssignment = {
  id: string;
  title: string;
  due_date: string;
};

// ----- weekly row with topic preview -----
function WeekRowView({ row, yearKey }: { row: WeekRow; yearKey: YearKey }) {
  const router = useRouter();
  
  const weeklyTopics = useMemo(() => {
    if (!row.mondayISO) return [];
    const plan = getDefaultPlanByStudentYear(yearKey);
    const mondayDate = new Date(row.mondayISO + 'T00:00:00.000Z');
    const weekEndDate = addDays(mondayDate, 6);
    const weekEvents = normalizeEvents(yearKey, {
      tz: 'Europe/London',
      clampStartISO: plan.termDates.michaelmas.start,
      clampEndISO: plan.termDates.easter.end,
      mode: 'week',
      weekStartISO: row.mondayISO,
      weekEndISO: format(weekEndDate, 'yyyy-MM-dd'),
    });
    return weekEvents.filter(e => e.kind === 'topic');
  }, [row.mondayISO, yearKey]);

  // Calculate default due date (Friday of the week)
  const quickAddDate = row.mondayISO 
    ? format(addDays(new Date(row.mondayISO), 4), 'yyyy-MM-dd') 
    : undefined;

  return (
    <div className="rounded-xl border px-3 py-2 space-y-2 hover:bg-gray-50 transition-colors group relative">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
          {row.id}{row.dateLabel ? ` · ${row.dateLabel}` : ''}
          
          {/* Quick Add Button (visible on hover) */}
          {quickAddDate && (
             <Link
               href={`/assignments?new=true&date=${quickAddDate}`}
               className="text-gray-300 hover:text-violet-600 opacity-0 group-hover:opacity-100 transition-all p-0.5"
               title="Add assignment due this week"
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
             </Link>
          )}
        </div>
        {row.deadlines.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-end">
            {row.deadlines.map((d, i) =>
              d.isPersonal ? (
                <Link 
                  key={i} 
                  href={`/assignments?assignmentId=${d.id}`} 
                  className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 text-xs px-2 py-1 border border-emerald-100 hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  {d.label}
                </Link>
              ) : d.danger ? (
                <DangerPill key={i} text={d.label} />
              ) : (
                <Pill key={i} text={d.label} />
              )
            )}
          </div>
        )}
      </div>

      {weeklyTopics.length > 0 ? (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400 font-medium">Topics:</span>
          {weeklyTopics.slice(0, 3).map(topic => (
            <span
              key={topic.id}
              title={topic.title}
              className="inline-block rounded bg-blue-50 text-blue-700 text-[10px] px-1.5 py-0.5 border border-blue-100"
            >
              {topic.moduleCode ?? topic.title.split(':')[0]}
            </span>
          ))}
          {weeklyTopics.length > 3 && (
            <span className="text-[10px] text-gray-400">+{weeklyTopics.length - 3}</span>
          )}
        </div>
      ) : (
        row.deadlines.length === 0 && (
          <div className="text-xs text-gray-300 italic">No activities this week</div>
        )
      )}
    </div>
  );
}

// ----- term card -----
function TermCardView({ t, yearKey }: { t: TermCard; yearKey: YearKey }) {
  return (
    <div className="rounded-2xl shadow-sm border bg-white p-5 flex flex-col h-full">
      <div className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">
        Semester
      </div>
      <div className="flex items-baseline justify-between mb-4 border-b pb-2">
        <h3 className="text-lg font-bold text-gray-900">{t.title}</h3>
        <div className="text-xs text-gray-500 font-medium">{t.dateRangeLabel}</div>
      </div>

      {t.modules.length > 0 && (
        <div className="mb-4 bg-gray-50 p-3 rounded-lg">
          <div className="text-xs font-semibold text-gray-600 mb-1">Modules</div>
          <ul className="list-disc pl-4 text-xs text-gray-600 leading-5">
            {t.modules.map((m) => <li key={m}>{m}</li>)}
          </ul>
        </div>
      )}

      <div className="space-y-2 flex-1">
        {t.weeks.map((w) => <WeekRowView key={w.id} row={w} yearKey={yearKey} />)}
      </div>
    </div>
  );
}

// ----- page -----
const YearAtAGlancePage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth() || { user: null };
  const { loading: profileLoading, yearKey: profileYear } = useStudentProfile();
  const [assignments, setAssignments] = useState<PersonalAssignment[]>([]);

  const urlYear: YearKey | null = useMemo(() => {
    const q = typeof router.query?.y === 'string' ? router.query.y : undefined;
    return q ? parseYearKey(q) : null;
  }, [router.query?.y]);

  // We wait until either URL has a year or the profile has loaded.
  const [year, setYear] = useState<YearKey | null>(null);

  // Fetch assignments
  useEffect(() => {
    if (!user?.id) return;
    const fetchAssignments = async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return;
      const { data } = await supabase
        .from('assignments')
        .select('id, title, due_date')
        .eq('user_id', user.id);
      
      if (data) {
        setAssignments(data);
      }
    };
    fetchAssignments();
  }, [user?.id]);

  // Decide selected year once (no early fallback persist)
  useEffect(() => {
    // URL wins
    if (urlYear) {
      setYear(urlYear);
      return;
    }
    
    // Fallback timer in case profile loading hangs
    const timer = setTimeout(() => {
      if (!year) setYear('year1');
    }, 1500);

    // If profile is loaded, choose profile year or last-resort year1
    if (!profileLoading) {
      const chosen: YearKey = (profileYear ?? 'year1') as YearKey;
      setYear(chosen);
      if (profileYear) {
        // Keep URL shareable by injecting ?y=
        router.replace(
          { pathname: router.pathname, query: { ...router.query, y: profileYear } },
          undefined,
          { shallow: true }
        );
      }
    }
    
    return () => clearTimeout(timer);
  }, [urlYear, profileLoading, profileYear, router, year]);

  // Persist only after we have a real selection
  useEffect(() => {
    if (year) persistYearKey(year);
  }, [year]);

  // Merge assignments into the plan
  const dynamicPlan = useMemo(() => {
    if (!year) return null;
    const staticPlan = buildYearPlanFromData(year);
    
    if (assignments.length === 0) return staticPlan as unknown as { terms: TermCard[] };

    // Clone plan to avoid mutation and cast to compatible type
    // We need to cast because staticPlan deadlines don't have isPersonal
    const newTerms = staticPlan.terms.map(t => ({
      ...t,
      weeks: t.weeks.map(w => ({
        ...w,
        deadlines: w.deadlines.map(d => ({ ...d, isPersonal: false })) as ExtendedDeadline[]
      }))
    }));

    assignments.forEach(a => {
      const due = new Date(a.due_date);
      
      // Find which week this assignment falls into
      for (const term of newTerms) {
        for (const week of term.weeks) {
          if (!week.mondayISO) continue;
          const start = new Date(week.mondayISO);
          const end = addDays(start, 6);
          
          // Check if due date is within this week (inclusive)
          // Simple check to avoid date-fns version issues
          if (due >= start && due <= end) {
            week.deadlines.push({
              id: a.id,
              label: `My Task: ${a.title}`,
              isPersonal: true
            });
          }
        }
      }
    });

    return { terms: newTerms };
  }, [year, assignments]);

  // Loading state: avoid flashing Year 1 before profile arrives
  if (!year || !dynamicPlan) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-8" />
        <div className="grid md:grid-cols-3 gap-6">
          {[0,1,2].map(i => (
            <div key={i} className="rounded-2xl border bg-white p-6 h-96">
              <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
              <div className="space-y-3">
                {[...Array(6)].map((_,j) => <div key={j} className="h-4 bg-gray-100 rounded" />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const prev = getPrevYearKey(year);
  const next = getNextYearKey(year);
  const plan = dynamicPlan.terms;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Top bar: breadcrumb + arrows + view buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="text-sm text-gray-500 mb-1">
            <span className="opacity-70">Academic Calendar</span>
            <span className="mx-2">•</span>
            <span className="font-semibold text-purple-700">{YEAR_LABEL[year]}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Year at a Glance
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white rounded-xl border p-1 shadow-sm">
            {prev && (
              <button
                className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
                onClick={() => { persistYearKey(prev); router.push(hrefYear(prev)); }}
                title={`Go to ${YEAR_LABEL[prev]}`}
              >
                ← {YEAR_LABEL[prev].replace('Year ', 'Yr ')}
              </button>
            )}
            <div className="w-px h-4 bg-gray-200 mx-1" />
            {next && (
              <button
                className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
                onClick={() => { persistYearKey(next); router.push(hrefYear(next)); }}
                title={`Go to ${YEAR_LABEL[next]}`}
              >
                {YEAR_LABEL[next].replace('Year ', 'Yr ')} →
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <Link href={hrefMonth(year)} className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors shadow-sm">
              Month View
            </Link>
            <Link href={hrefWeek(year)} className="px-4 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 text-sm font-medium transition-colors shadow-sm">
              Week View
            </Link>
          </div>
        </div>
      </div>

      {/* Year-specific guidance banners */}
      {year && (
        <div className="mb-8">
          {year === 'foundation' && (
            <div className="bg-amber-50 border-l-4 border-amber-400 text-amber-800 p-4 rounded-r-xl shadow-sm flex items-start gap-3" role="alert">
              <span className="text-xl">🌱</span>
              <div>
                <p className="font-bold text-sm uppercase tracking-wide opacity-80 mb-1">Foundation Year</p>
                <p>Welcome! Focus on understanding core legal concepts and building consistent study habits this year.</p>
              </div>
            </div>
          )}
          {year === 'year1' && (
            <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-r-xl shadow-sm flex items-start gap-3" role="alert">
              <span className="text-xl">🏛️</span>
              <div>
                <p className="font-bold text-sm uppercase tracking-wide opacity-80 mb-1">Year 1</p>
                <p>You're building the bedrock of your legal knowledge. Focus on mastering the "Big 7" core modules.</p>
              </div>
            </div>
          )}
          {year === 'year2' && (
            <div className="bg-purple-50 border-l-4 border-purple-500 text-purple-800 p-4 rounded-r-xl shadow-sm flex items-start gap-3" role="alert">
              <span className="text-xl">⚖️</span>
              <div>
                <p className="font-bold text-sm uppercase tracking-wide opacity-80 mb-1">Year 2</p>
                <p>Time to specialize. Deepen your critical analysis and start thinking about your dissertation topics.</p>
              </div>
            </div>
          )}
          {year === 'year3' && (
            <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 p-4 rounded-r-xl shadow-sm flex items-start gap-3" role="alert">
              <span className="text-xl">🎓</span>
              <div>
                <p className="font-bold text-sm uppercase tracking-wide opacity-80 mb-1">Final Year</p>
                <p>The home stretch! Prioritize your dissertation and career preparation. You've got this.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Three-column academic plan */}
      <div className="grid md:grid-cols-3 gap-6">
        {plan.map((t) => <TermCardView key={t.title} t={t as TermCard} yearKey={year} />)}
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-400">
          Tip: Your personal assignments (in green) are automatically overlaid on the academic calendar.
        </p>
      </div>
    </div>
  );
};

export default YearAtAGlancePage;
