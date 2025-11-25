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

// ----- local types -----
type Deadline = { label: string; danger?: boolean };
type WeekRow = { id: string; dateLabel?: string; mondayISO?: string; deadlines: Deadline[] };
type TermCard = {
  key: 'michaelmas' | 'epiphany' | 'easter';
  title: string;
  dateRangeLabel: string;
  modules: string[];
  weeks: WeekRow[];
};

// ----- weekly row with topic preview -----
function WeekRowView({ row, yearKey }: { row: WeekRow; yearKey: YearKey }) {
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

  return (
    <div className="rounded-xl border px-3 py-2 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">
          {row.id}{row.dateLabel ? ` · ${row.dateLabel}` : ''}
        </div>
        {row.deadlines.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {row.deadlines.map((d, i) =>
              d.danger ? <DangerPill key={i} text={d.label} /> : <Pill key={i} text={d.label} />
            )}
          </div>
        )}
      </div>

      {weeklyTopics.length > 0 ? (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500">Topics:</span>
          {weeklyTopics.slice(0, 3).map(topic => (
            <span
              key={topic.id}
              title={topic.title}
              className="inline-block rounded bg-blue-50 text-blue-700 text-[10px] px-1.5 py-0.5 border border-blue-200"
            >
              {topic.moduleCode ?? topic.title.split(':')[0]}
            </span>
          ))}
          {weeklyTopics.length > 3 && (
            <span className="text-[10px] text-gray-500">+{weeklyTopics.length - 3}</span>
          )}
        </div>
      ) : (
        row.deadlines.length === 0 && (
          <div className="text-xs text-gray-400 italic">No activities this week</div>
        )
      )}
    </div>
  );
}

// ----- term card -----
function TermCardView({ t, yearKey }: { t: TermCard; yearKey: YearKey }) {
  return (
    <div className="rounded-2xl shadow-sm border bg-white p-5">
      <div className="text-sm uppercase tracking-wide text-gray-600 font-semibold mb-1">
        Semester
      </div>
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-lg font-semibold">{t.title}</h3>
        <div className="text-xs text-gray-500">{t.dateRangeLabel}</div>
      </div>

      {t.modules.length > 0 && (
        <div className="mb-3">
          <div className="text-sm text-gray-600 mb-1">Modules (this term)</div>
          <ul className="list-disc pl-5 text-sm leading-6">
            {t.modules.map((m) => <li key={m}>{m}</li>)}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        {t.weeks.map((w) => <WeekRowView key={w.id} row={w} yearKey={yearKey} />)}
      </div>
    </div>
  );
}

// ----- page -----
const YearAtAGlancePage: React.FC = () => {
  const router = useRouter();
  const { loading: profileLoading, yearKey: profileYear } = useStudentProfile();

  const urlYear: YearKey | null = useMemo(() => {
    const q = typeof router.query?.y === 'string' ? router.query.y : undefined;
    return q ? parseYearKey(q) : null;
  }, [router.query?.y]);

  // We wait until either URL has a year or the profile has loaded.
  const [year, setYear] = useState<YearKey | null>(null);

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

  // Loading state: avoid flashing Year 1 before profile arrives
  if (!year) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="h-6 w-60 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="grid md:grid-cols-3 gap-5">
          {[0,1,2].map(i => (
            <div key={i} className="rounded-2xl border bg-white p-5">
              <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
              <div className="space-y-2">
                {[...Array(6)].map((_,j) => <div key={j} className="h-3 bg-gray-100 rounded" />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const prev = getPrevYearKey(year);
  const next = getNextYearKey(year);
  const yearPlan = buildYearPlanFromData(year);
  const plan = yearPlan.terms;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Top bar: breadcrumb + arrows + view buttons */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="text-sm text-gray-500">
          <span className="opacity-70">My Year at a Glance</span>
          <span className="mx-2">•</span>
          <span className="font-semibold text-purple-700">{YEAR_LABEL[year]}</span>
        </div>

        <div className="flex items-center gap-2">
          {prev && (
            <button
              className="px-3 py-2 rounded-xl border hover:bg-gray-50"
              onClick={() => { persistYearKey(prev); router.push(hrefYear(prev)); }}
              aria-label={`Go to ${YEAR_LABEL[prev]}`}
            >
              ← {YEAR_LABEL[prev]}
            </button>
          )}
          {next && (
            <button
              className="px-3 py-2 rounded-xl border hover:bg-gray-50"
              onClick={() => { persistYearKey(next); router.push(hrefYear(next)); }}
              aria-label={`Go to ${YEAR_LABEL[next]}`}
            >
              {YEAR_LABEL[next]} →
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl md:text-3xl font-bold">
          My Year at a Glance • {YEAR_LABEL[year]}
        </h1>
        <div className="flex gap-2">
          <Link href={hrefMonth(year)} className="px-4 py-2 rounded-xl bg-purple-700 text-white hover:opacity-95">
            Month View
          </Link>
          <Link href={hrefWeek(year)} className="px-4 py-2 rounded-xl bg-purple-700 text-white hover:opacity-95">
            Week View
          </Link>
        </div>
      </div>

      {/* Year-specific guidance banners */}
      {year && (
        <div className="mb-6">
          {year === 'foundation' && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-r-lg" role="alert">
              <p className="font-bold">Foundation Year Guidance</p>
              <p>Welcome to your first year! Focus on understanding the core concepts and building good study habits.</p>
            </div>
          )}
          {year === 'year1' && (
            <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-r-lg" role="alert">
              <p className="font-bold">Year 1 - Building Your Foundation</p>
              <p>You're now studying the core modules of law. Focus on understanding fundamental principles and developing strong analytical skills.</p>
            </div>
          )}
          {year === 'year2' && (
            <div className="bg-purple-100 border-l-4 border-purple-500 text-purple-700 p-4 rounded-r-lg" role="alert">
              <p className="font-bold">Year 2 - Advancing Your Knowledge</p>
              <p>Dive deeper into specialized areas of law. Focus on developing critical analysis and legal reasoning skills.</p>
            </div>
          )}
          {year === 'year3' && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-r-lg" role="alert">
              <p className="font-bold">Year 3 - Final Year</p>
              <p>Focus on your dissertation and career preparation. You're almost there!</p>
            </div>
          )}
        </div>
      )}

      {/* Three-column academic plan */}
      <div className="grid md:grid-cols-3 gap-5">
        {plan.map((t) => <TermCardView key={t.title} t={t as TermCard} yearKey={year} />)}
      </div>

      <p className="text-xs text-gray-500 mt-6">
        Tip: Use the arrows at top-right to jump across Foundation ↔ Year 1 ↔ Year 2 ↔ Year 3.
      </p>
    </div>
  );
};

export default YearAtAGlancePage;
