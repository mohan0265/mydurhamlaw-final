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

type Deadline = {
  label: string;   // e.g. "Tort Law • Essay"
  tone?: 'danger' | 'neutral';
};
type WeekRow = {
  id: string;      // "W1", "W2"
  dateLabel?: string; // "6 Oct", etc. (optional)
  deadlines?: Deadline[];
};
type TermCard = {
  title: string;    // "Michaelmas"
  dates: string;    // "6 Oct – 12 Dec"
  modules?: string[];
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
        {(row.deadlines || []).map((d, i) =>
          d.tone === 'danger' ? <DangerPill key={i} text={d.label} /> : <Pill key={i} text={d.label} />
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
        <div className="text-xs text-gray-500">{t.dates}</div>
      </div>

      {t.modules && t.modules.length > 0 && (
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

/**
 * TEMP data bridge so the Year view looks like your “good” screenshot.
 * Next step: swap this for a real adapter that reads src/data/durham/llb/*.
 */
function buildYearPlan(y: YearKey): TermCard[] {
  // Shared module list for Year 1 (adjust per year when wiring real data)
  const y1Modules = [
    'Tort Law',
    'Contract Law',
    'European Union Law',
    'UK Constitutional Law',
    'The Individual and the State',
    'Introduction to English Law and Legal Method',
  ];

  if (y === 'year1') {
    return [
      {
        title: 'Michaelmas',
        dates: '6 Oct – 12 Dec',
        modules: y1Modules,
        weeks: [
          { id: 'W1', dateLabel: '6 Oct' },
          { id: 'W2', dateLabel: '13 Oct' },
          { id: 'W3', dateLabel: '20 Oct' },
          { id: 'W4', dateLabel: '27 Oct' },
          { id: 'W5', dateLabel: '3 Nov' },
          {
            id: 'W6',
            dateLabel: '10 Nov',
            deadlines: [
              { label: 'Tort Law • Essay' },
              { label: 'UK Constitutional Law • Essay' },
            ],
          },
          { id: 'W7', dateLabel: '17 Nov' },
          {
            id: 'W8',
            dateLabel: '24 Nov',
            deadlines: [{ label: 'European Union Law • Essay' }],
          },
          { id: 'W9', dateLabel: '1 Dec' },
          {
            id: 'W10',
            dateLabel: '8 Dec',
            deadlines: [{ label: 'IELLM • Essay' }],
          },
        ],
      },
      {
        title: 'Epiphany',
        dates: '12 Jan – 20 Mar',
        modules: y1Modules,
        weeks: [
          { id: 'W1', dateLabel: '12 Jan' },
          { id: 'W2', dateLabel: '19 Jan' },
          { id: 'W3', dateLabel: '26 Jan' },
          { id: 'W4', dateLabel: '2 Feb' },
          { id: 'W5', dateLabel: '9 Feb' },
          {
            id: 'W6',
            dateLabel: '16 Feb',
            deadlines: [{ label: 'Tort Law • Problem Question' }],
          },
          { id: 'W7', dateLabel: '23 Feb' },
          {
            id: 'W8',
            dateLabel: '2 Mar',
            deadlines: [{ label: 'Contract Law • Problem Question' }],
          },
          { id: 'W9', dateLabel: '9 Mar' },
          {
            id: 'W10',
            dateLabel: '16 Mar',
            deadlines: [{ label: 'The Individual and the State • Problem Question' }],
          },
        ],
      },
      {
        title: 'Easter (Revision & Exams)',
        dates: '27 Apr – 26 Jun',
        modules: [],
        weeks: [
          {
            id: 'W1',
            dateLabel: '27 Apr',
            deadlines: [
              { label: 'Tort Law • Exam', tone: 'danger' },
              { label: 'Contract Law • Exam', tone: 'danger' },
              { label: 'EU Law • Exam', tone: 'danger' },
              { label: 'UK Constitutional Law • Exam', tone: 'danger' },
              { label: 'The Individual and the State • Exam', tone: 'danger' },
              { label: 'IELLM • Exam', tone: 'danger' },
            ],
          },
          {
            id: 'W2',
            dateLabel: '4 May',
            deadlines: [
              { label: 'Tort Law • Exam', tone: 'danger' },
              { label: 'Contract Law • Exam', tone: 'danger' },
              { label: 'EU Law • Exam', tone: 'danger' },
              { label: 'UK Constitutional Law • Exam', tone: 'danger' },
              { label: 'The Individual and the State • Exam', tone: 'danger' },
              { label: 'IELLM • Exam', tone: 'danger' },
            ],
          },
          {
            id: 'W3',
            dateLabel: '11 May',
            deadlines: [
              { label: 'Tort Law • Exam', tone: 'danger' },
              { label: 'Contract Law • Exam', tone: 'danger' },
              { label: 'EU Law • Exam', tone: 'danger' },
              { label: 'UK Constitutional Law • Exam', tone: 'danger' },
              { label: 'The Individual and the State • Exam', tone: 'danger' },
              { label: 'IELLM • Exam', tone: 'danger' },
            ],
          },
          {
            id: 'W4',
            dateLabel: '18 May',
            deadlines: [
              { label: 'Tort Law • Exam', tone: 'danger' },
              { label: 'Contract Law • Exam', tone: 'danger' },
              { label: 'EU Law • Exam', tone: 'danger' },
              { label: 'UK Constitutional Law • Exam', tone: 'danger' },
              { label: 'The Individual and the State • Exam', tone: 'danger' },
              { label: 'IELLM • Exam', tone: 'danger' },
            ],
          },
          {
            id: 'W5',
            dateLabel: '25 May',
            deadlines: [
              { label: 'Tort Law • Exam', tone: 'danger' },
              { label: 'Contract Law • Exam', tone: 'danger' },
              { label: 'EU Law • Exam', tone: 'danger' },
              { label: 'UK Constitutional Law • Exam', tone: 'danger' },
              { label: 'The Individual and the State • Exam', tone: 'danger' },
              { label: 'IELLM • Exam', tone: 'danger' },
            ],
          },
          {
            id: 'W6',
            dateLabel: '1 Jun',
            deadlines: [
              { label: 'Tort Law • Exam', tone: 'danger' },
              { label: 'Contract Law • Exam', tone: 'danger' },
              { label: 'EU Law • Exam', tone: 'danger' },
              { label: 'UK Constitutional Law • Exam', tone: 'danger' },
              { label: 'The Individual and the State • Exam', tone: 'danger' },
              { label: 'IELLM • Exam', tone: 'danger' },
            ],
          },
          {
            id: 'W7',
            dateLabel: '8 Jun',
            deadlines: [
              { label: 'Tort Law • Exam', tone: 'danger' },
              { label: 'Contract Law • Exam', tone: 'danger' },
              { label: 'EU Law • Exam', tone: 'danger' },
              { label: 'UK Constitutional Law • Exam', tone: 'danger' },
              { label: 'The Individual and the State • Exam', tone: 'danger' },
              { label: 'IELLM • Exam', tone: 'danger' },
            ],
          },
          {
            id: 'W8',
            dateLabel: '15 Jun',
            deadlines: [
              { label: 'Tort Law • Exam', tone: 'danger' },
              { label: 'Contract Law • Exam', tone: 'danger' },
              { label: 'EU Law • Exam', tone: 'danger' },
              { label: 'UK Constitutional Law • Exam', tone: 'danger' },
              { label: 'The Individual and the State • Exam', tone: 'danger' },
              { label: 'IELLM • Exam', tone: 'danger' },
            ],
          },
          {
            id: 'W9',
            dateLabel: '22 Jun',
            deadlines: [
              { label: 'Tort Law • Exam', tone: 'danger' },
              { label: 'Contract Law • Exam', tone: 'danger' },
              { label: 'EU Law • Exam', tone: 'danger' },
              { label: 'UK Constitutional Law • Exam', tone: 'danger' },
              { label: 'The Individual and the State • Exam', tone: 'danger' },
              { label: 'IELLM • Exam', tone: 'danger' },
            ],
          },
        ],
      },
    ];
  }

  // For other years, render the same skeleton until we wire real data.
  return [
    { title: 'Michaelmas', dates: 'Oct – Dec', modules: [], weeks: Array.from({ length: 10 }, (_, i) => ({ id: `W${i + 1}` })) },
    { title: 'Epiphany', dates: 'Jan – Mar', modules: [], weeks: Array.from({ length: 10 }, (_, i) => ({ id: `W${i + 1}` })) },
    { title: 'Easter (Revision & Exams)', dates: 'Apr – Jun', modules: [], weeks: Array.from({ length: 6 }, (_, i) => ({ id: `W${i + 1}` })) },
  ];
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
  const plan = buildYearPlan(year);

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
