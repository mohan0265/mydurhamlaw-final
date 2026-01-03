// src/pages/year-at-a-glance/month.tsx
'use client';
import React, { useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/supabase/AuthContext'; // NEW: Get actual student year
import { 
  YEAR_LABEL, 
  YearKey, 
  parseYearKey, 
  parseYMParam,
  prevYM,
  nextYM,
  hrefMonthYM,
  hrefYear,
  getAcademicStartMonth,
  getAcademicYearFor
} from '@/lib/calendar/links';
import type { YM } from '@/lib/calendar/links';
import { getEventsForMonth, getAcademicYearFor as getAcademicYear } from '@/lib/calendar/useCalendarData';
import { getDefaultPlanByStudentYear } from '@/data/durham/llb';
import { format } from 'date-fns';

const MonthGrid = dynamic(() => import('@/components/calendar/MonthGrid').then(m => ({ default: m.MonthGrid })), {
  ssr: false,
});

const MonthPage: React.FC = () => {
  const router = useRouter();
  const { y: yParam, ym: ymParam } = router.query;
  const { userProfile } = useAuth(); // NEW: Get profile from auth

  // Parse year from query
  const year: YearKey = useMemo(() => {
    return parseYearKey(typeof yParam === 'string' ? yParam : undefined);
  }, [yParam]);

  // Parse month from query, with vacation period handling
  const ym: YM = useMemo(() => {
    // If no specific month requested, use CURRENT month (not October 2025)
    if (!ymParam) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11
      return { year: currentYear, month: currentMonth };
    }
    
    // Otherwise use academic year defaults
    const academicStartMonth = getAcademicStartMonth(year);
    const academicYear = getAcademicYear(year);
    const fallback: YM = { 
      year: academicYear, 
      month: academicStartMonth
    };
    return parseYMParam(fallback, typeof ymParam === 'string' ? ymParam : undefined);
  }, [ymParam, year]);

  // Get student's actual year from profile (year_of_study)
  const studentYear: YearKey = useMemo(() => {
    const yearOfStudy = userProfile?.year_of_study || userProfile?.year_group;
    return parseYearKey(yearOfStudy);
  }, [userProfile]);
  
  // TEMPORARY FIX: Disable gating so all students can view all years
  // This will be fixed properly when we fetch profile data correctly
  const isOwnYear = true; // was: year === studentYear

  // Load events for the current month
  const events = useMemo(() => getEventsForMonth(year, ym), [year, ym]);

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
        yearKey={year}
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