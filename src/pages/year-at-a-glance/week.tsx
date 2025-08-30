// src/pages/year-at-a-glance/week.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  YEAR_LABEL, YearKey, parseYearKey, hrefYear, getStudentYear
} from '@/lib/calendar/links';

const WeekPage: React.FC = () => {
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
        <div className="text-sm text-gray-500">{YEAR_LABEL[year]} • Week View</div>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold mb-2">Week View • {YEAR_LABEL[year]}</h1>

      {!isOwnYear ? (
        <div className="rounded-2xl border bg-white p-6">
          <p className="font-semibold mb-2">Browse-only</p>
          <p className="text-sm text-gray-600">
            Detailed weekly schedules are visible only for your enrolled year
            (<span className="font-semibold"> {YEAR_LABEL[studentYear]}</span>). Use the Year page to explore the outline.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border bg-white p-6">
          <p className="font-semibold mb-4">Your weekly schedule</p>

          {/* Replace this list with real data mapping from src/data/durham/llb/* when ready */}
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="rounded-xl border p-4">
                <div className="font-medium mb-1">W{i + 1}</div>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Lectures: Tort / Contract / EU / UK Const / IELLM</li>
                  <li>• Seminar: Problem question workshop</li>
                  <li>• Task: Reading & outline</li>
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeekPage;
