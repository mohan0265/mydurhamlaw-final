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

type Deadline = {
  label: string;   // e.g. "Tort Law • Essay"
  danger?: boolean;  // Match YearPlan interface
};
type WeekRow = {
  id: string;      // "W1", "W2"
  dateLabel?: string; // "6 Oct", etc. (optional)
  deadlines: Deadline[];  // Required array
};
type TermCard = {
  key: 'michaelmas' | 'epiphany' | 'easter';  // Match YearPlan interface
  title: string;    // "Michaelmas"
  dateRangeLabel: string;    // "6 Oct – 12 Dec" - Match YearPlan interface
  modules: string[];  // Required array
  weeks: WeekRow[];
};

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

function WeekRowView({ row }: { row: WeekRow }) {
  return (
    <div className="rounded-xl border px-3 py-2 flex items-center justify-between">
      <div className="text-sm font-medium">{row.id}{row.dateLabel ? ` · ${row.dateLabel}` : ''}</div>
      <div className="flex flex-wrap gap-2">
        {row.deadlines.map((d, i) =>
          d.danger ? <DangerPill key={i} text={d.label} /> : <Pill key={i} text={d.label} />
        )}
      </div>
    </div>
  );
}

function TermCardView({ t }: { t: TermCard }) {
  return (
    <div className="rounded-2xl shadow-sm border bg-white p-5">
      <div className="text-sm uppercase tracking-wide text-gray-600 font-semibold mb-1">Semester</div>
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
        {t.weeks.map((w) => <WeekRowView key={w.id} row={w} />)}
      </div>
    </div>
  );
}


const YearAtAGlancePage: React.FC = () => {
  const router = useRouter();
  const qYear = typeof router.query?.y === 'string' ? router.query.y : undefined;
  const year: YearKey = useMemo(() => parseYearKey(qYear), [qYear]);

  useEffect(() => {
    persistYearKey(year);
  }, [year]);

  const prev = getPrevYearKey(year);
  const next = getNextYearKey(year);
  const yearPlan = buildYearPlanFromData(year);
  const plan = yearPlan.terms;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Top bar: breadcrumb + arrows + view buttons */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="text-sm text-gray-500">
          <span className="opacity-70">Foundation</span>
          <span className="mx-2">•</span>
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
        <h1 className="text-2xl md:text-3xl font-bold">My Year at a Glance • {YEAR_LABEL[year]}</h1>
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
        {plan.map((t) => <TermCardView key={t.title} t={t} />)}
      </div>

      <p className="text-xs text-gray-500 mt-6">
        Tip: Use the arrows at top-right to jump across Foundation ↔ Year 1 ↔ Year 2 ↔ Year 3.
      </p>
    </div>
  );
};

export default YearAtAGlancePage;
