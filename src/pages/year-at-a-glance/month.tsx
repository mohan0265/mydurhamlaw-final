// src/pages/year-at-a-glance/month.tsx
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import {
  YEAR_LABEL, YearKey, parseYearKey, readYearKey, persistYearKey,
  hrefYear, hrefMonth,
} from '@/lib/calendar/links';
import { Calendar } from 'lucide-react';
import { useContext } from 'react';
import { AuthContext } from '@/lib/supabase/AuthContext';

const MonthViewClient = dynamic(() => import('@/components/calendar/MonthView').then(m => m.MonthView), {
  ssr: false,
});

// Simple adapter component
function MonthViewAdapter() {
  // Provide minimal props to prevent crashes
  return (
    <div className="text-center py-8 text-gray-600">
      <p>Month view is currently being developed.</p>
      <p className="text-sm mt-2">This will show your detailed monthly schedule once completed.</p>
    </div>
  );
}

function getStudentYearKey(userYearGroup?: string | null): YearKey {
  const v = (userYearGroup || '').toLowerCase().replace(/\s+/g, '');
  if (v === 'foundation' || v === 'year1' || v === 'year2' || v === 'year3') return v as YearKey;
  return 'year1';
}

export default function MonthPage() {
  const router = useRouter();
  const { userProfile } = useContext(AuthContext);

  const y: YearKey = parseYearKey(router.query.y ?? readYearKey());
  useEffect(() => { persistYearKey(y); }, [y]);

  const studentYear = getStudentYearKey(userProfile?.year_group);

  const title = `Month View • ${YEAR_LABEL[y]}`;

  return (
    <>
      <Head><title>{title}</title></Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl sm:text-2xl font-semibold">{title}</h1>
          <Link href={hrefYear(y)} className="text-purple-600 underline">Back to Year</Link>
        </div>

        {y !== studentYear ? (
          <div className="max-w-xl rounded-lg border p-6 bg-white">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Calendar className="w-5 h-5" />
              <b>Browse-only</b>
            </div>
            <p className="text-gray-700 mb-4">
              Detailed Month view is only available for your current study year
              (<b>{YEAR_LABEL[studentYear]}</b>). You're browsing <b>{YEAR_LABEL[y]}</b>.
            </p>
            <div className="flex gap-2">
              <Link href={hrefYear(y)} className="rounded-md border px-3 py-2">Back to Year</Link>
              <Link href={hrefMonth(studentYear)} className="rounded-md bg-purple-600 text-white px-3 py-2">
                Go to my Month view
              </Link>
            </div>
          </div>
        ) : (
          <MonthViewAdapter />
        )}
      </div>
    </>
  );
}