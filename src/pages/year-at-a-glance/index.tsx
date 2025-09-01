// src/pages/year-at-a-glance/index.tsx
import React, { useMemo, useEffect } from 'react';
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

// ---------- small pills ----------
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

// ---------- types used only by this page ----------
type Deadline = {
  label: string;          // e.g. "Tort Law • Essay"
  danger?: boolean;
};
type WeekRow = {
  id: string;             // "W1", "W2"
  dateLabel?: string;     // "6 Oct"
  mondayISO?: string;     // Monday to preview topics
  deadlines: Deadline[];
};
type TermCard = {
  key: 'michaelmas' | 'epiphany' | 'easter';
  title: string;
  dateRangeLabel: string;
  modules: string[];
  weeks: WeekRow[];
};

// ---------- single week row (with topic preview) ----------
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

      {weeklyTopics.length > 0 && (
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
      )}

      {weeklyTopics.length === 0 && row.deadlines.length === 0 && (
        <div className="text-xs text-gray-400 italic">No activities this week</div>
      )}
    </div>
  );
}

// ---------- term card ----------
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

// ---------- page ----------
const YearAtAGlancePage: React.FC = () => {
  const router = useRouter();

  // 1) Read year from URL (if any)
  const qYear = typeof router.query?.y === 'string' ? router.query.y : undefined;
  const urlYear = useMemo(() => parseYearKey(qYear), [qYear]);

  // 2) Read logged-in student's year from Supabase
  const { data: profile } = useStudentProfile();
  const profileYear = profile?.yearKey ?? null;

  // 3) Final selected year: URL -> profile -> fallback
  const year: YearKey = urlYear ?? profileYear ?? 'year1';

  // Keep URL consistent (nice for sharing): if no ?y but we have a profile year, inject it
  useEffect(() => {
    if (!urlYear && profileYear) {
      router.replace(
        { pathname: router.pathname, query: { ...router.query, y: profileYear } },
        undefined,
        { shallow: true }
      );
    }
  }, [urlYear, profileYear, router]);

  // Persist for local navigation convenience
  useEffect(() => {
    persistYearKey(year);
  }, [year]);

  // Prev/next and plan for selected year
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
