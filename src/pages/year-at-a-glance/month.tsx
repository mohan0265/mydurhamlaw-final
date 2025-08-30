// src/pages/year-at-a-glance/month.tsx
'use client';
import React, { useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { 
  YEAR_LABEL, 
  YearKey, 
  parseYearKey, 
  getStudentYear,
  parseYMParam,
  prevYM,
  nextYM,
  hrefMonthYM,
  hrefYear,
  getAcademicStartMonth
} from '@/lib/calendar/links';
import type { YM } from '@/lib/calendar/links';
import { useMonthData } from '@/lib/calendar/useCalendarData';

const MonthGrid = dynamic(() => import('@/components/calendar/MonthGrid').then(m => ({ default: m.MonthGrid })), {
  ssr: false,
});

const MonthPage: React.FC = () => {
  const router = useRouter();
  const { y: yParam, ym: ymParam } = router.query;

  // Parse year from query
  const year: YearKey = useMemo(() => {
    return parseYearKey(typeof yParam === 'string' ? yParam : undefined);
  }, [yParam]);

  // Parse month from query, default to academic start month
  const ym: YM = useMemo(() => {
    const academicStartMonth = getAcademicStartMonth(year);
    const fallback: YM = { 
      year: 2025, 
      month: academicStartMonth + 1 // Convert from 0-based to 1-based
    };
    return parseYMParam(fallback, typeof ymParam === 'string' ? ymParam : undefined);
  }, [ymParam, year]);

  const studentYear = getStudentYear();
  const isOwnYear = year === studentYear;

  // Load events for the current month
  const events = useMonthData(year, ym);

  // Navigation handlers
  const handlePrev = useCallback(() => {
    const prevMonth = prevYM(ym);
    router.push(hrefMonthYM(year, prevMonth));
  }, [router, year, ym]);

  const handleNext = useCallback(() => {
    const nextMonth = nextYM(ym);
    router.push(hrefMonthYM(year, nextMonth));
  }, [router, year, ym]);

  const handleBack = useCallback(() => {
    router.push(hrefYear(year));
  }, [router, year]);

  const title = `${YEAR_LABEL[year]} • Month View`;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={`Monthly calendar view for ${YEAR_LABEL[year]}`} />
      </Head>

      <MonthGrid
        year={year}
        ym={ym}
        events={events}
        onPrev={handlePrev}
        onNext={handleNext}
        onBack={handleBack}
        gated={!isOwnYear}
      />
    </>
  );
};

export default MonthPage;