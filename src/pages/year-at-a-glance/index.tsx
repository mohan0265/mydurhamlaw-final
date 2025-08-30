// src/pages/year-at-a-glance/index.tsx
import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  YEAR_LABEL, YearKey, parseYearKey, persistYearKey, readYearKey,
  hrefMonth, hrefWeek, getPrevYearKey, getNextYearKey, hrefYear
} from '@/lib/calendar/links';

// Your existing 3-column Year component – kept simple here.
// If you already have a nice component, import and use it instead.
const ColumnCard: React.FC<{ title: string; children?: React.ReactNode }> = ({ title, children }) => (
  <div className="rounded-2xl shadow p-4 bg-white border">
    <div className="font-semibold mb-3">{title}</div>
    <div>{children}</div>
  </div>
);

const YearAtAGlancePage: React.FC = () => {
  const router = useRouter();
  const qYear = typeof router.query?.y === 'string' ? router.query.y : undefined;

  // Resolve selected year from query or localStorage fallback
  const year: YearKey = useMemo(() => {
    return parseYearKey(qYear) || readYearKey();
  }, [qYear]);

  useEffect(() => {
    persistYearKey(year);
  }, [year]);

  const prev = getPrevYearKey(year);
  const next = getNextYearKey(year);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Breadcrumb-ish header */}
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
            <Link href={hrefYear(prev)} className="px-3 py-2 rounded-xl border hover:bg-gray-50">
              ← {YEAR_LABEL[prev]}
            </Link>
          )}
          {next && (
            <Link href={hrefYear(next)} className="px-3 py-2 rounded-xl border hover:bg-gray-50">
              {YEAR_LABEL[next]} →
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
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

      {/* 3 columns: Michaelmas / Epiphany / Easter (overview bullets) */}
      <div className="grid md:grid-cols-3 gap-5">
        <ColumnCard title="Michaelmas (Oct–Dec)">
          <ul className="list-disc pl-5 text-sm leading-6">
            <li>Core modules overview</li>
            <li>Weeks W1–W10, essay checkpoints</li>
          </ul>
        </ColumnCard>
        <ColumnCard title="Epiphany (Jan–Mar)">
          <ul className="list-disc pl-5 text-sm leading-6">
            <li>Core modules overview</li>
            <li>Problem question deadlines</li>
          </ul>
        </ColumnCard>
        <ColumnCard title="Easter (Apr–Jun)">
          <ul className="list-disc pl-5 text-sm leading-6">
            <li>Revision weeks & exam windows</li>
          </ul>
        </ColumnCard>
      </div>

      <p className="text-xs text-gray-500 mt-6">
        Tip: Use the arrows at top-right to jump across Foundation ↔ Year 1 ↔ Year 2 ↔ Year 3.
      </p>
    </div>
  );
};

export default YearAtAGlancePage;
