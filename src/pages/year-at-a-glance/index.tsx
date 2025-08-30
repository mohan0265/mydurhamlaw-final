// src/pages/year-at-a-glance/index.tsx
import { useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

import {
  YEAR_LABEL,
  YearKey,
  parseYearKey,
  getPrevYearKey,
  getNextYearKey,
  hrefMonth,
  hrefWeek,
  hrefYear,
  persistYearKey,
  readYearKey,
} from '@/lib/calendar/links';

const YearView = dynamic(() => import('@/components/calendar/YearView').then(m => m.default), {
  ssr: false,
});

function label(y: YearKey) {
  return YEAR_LABEL[y];
}

function yearKeyToStudyNumber(y: YearKey): number {
  switch (y) {
    case 'foundation': return 0;
    case 'year1': return 1;
    case 'year2': return 2;
    case 'year3': return 3;
  }
}

export default function YearAtAGlanceIndex() {
  const router = useRouter();
  const y: YearKey = parseYearKey(router.query.y ?? readYearKey());

  useEffect(() => { persistYearKey(y); }, [y]);

  const prevY = getPrevYearKey(y);
  const nextY = getNextYearKey(y);

  return (
    <>
      <Head>
        <title>My Year at a Glance – {label(y)}</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 hover:bg-gray-50"
              onClick={() => { persistYearKey(prevY); router.push(hrefYear(prevY)); }}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{label(prevY)}</span>
            </button>

            <h1 className="text-xl sm:text-2xl font-semibold px-2">
              My Year at a Glance • <span className="text-purple-600">{label(y)}</span>
            </h1>

            <button
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 hover:bg-gray-50"
              onClick={() => { persistYearKey(nextY); router.push(hrefYear(nextY)); }}
            >
              <span>{label(nextY)}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Link href={hrefMonth(y)} className="rounded-md bg-purple-600 text-white px-3 py-2 text-sm">
              Month View
            </Link>
            <Link href={hrefWeek(y)} className="rounded-md bg-purple-600 text-white px-3 py-2 text-sm">
              Week View
            </Link>
          </div>
        </div>

        <div className="mb-4">
          <div className="inline-flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Viewing: <b>{label(y)}</b></span>
          </div>
        </div>

        <YearView userYearOfStudy={yearKeyToStudyNumber(y)} />
      </div>
    </>
  );
}