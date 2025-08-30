// src/pages/year-at-a-glance/month.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  YEAR_LABEL, YearKey, parseYearKey, hrefYear, getStudentYear
} from '@/lib/calendar/links';

const MonthPage: React.FC = () => {
  const router = useRouter();
  const yParam = typeof router.query?.y === 'string' ? router.query.y : undefined;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const year: YearKey = useMemo(() => parseYearKey(yParam), [yParam]);
  const studentYear = getStudentYear();
  const isOwnYear = year === studentYear;

  if (!mounted) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <Link href={hrefYear(year)} className="text-purple-700 hover:underline">← Back to Year</Link>
        <div className="text-sm text-gray-500">{YEAR_LABEL[year]} • Month View</div>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold mb-2">Month View • {YEAR_LABEL[year]}</h1>

      {!isOwnYear ? (
        <div className="rounded-2xl border bg-white p-6">
          <p className="font-semibold mb-2">Browse-only</p>
          <p className="text-sm text-gray-600">
            You’re viewing {YEAR_LABEL[year]}. Detailed timetables are available only for your enrolled year
            (<span className="font-semibold">{YEAR_LABEL[studentYear]}</span>). Use the Year page to explore the syllabus outline.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border bg-white p-6">
          <p className="font-semibold mb-2">Your monthly schedule</p>
          <p className="text-sm text-gray-600 mb-4">
            This section renders the current academic year’s months with prefilled topics/deadlines.
          </p>

          {/* Simple 3×4 grid of months (placeholder layout; hook up your dataset here) */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              'Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep'
            ].map((m) => (
              <div key={m} className="rounded-xl border p-4">
                <div className="font-medium mb-2">{m}</div>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Lectures / Seminars</li>
                  <li>• Deadlines / Exams</li>
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthPage;
