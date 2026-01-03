// src/pages/year-at-a-glance/week.tsx
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
  parseWeekStartParam,
  addWeeksISO,
  hrefWeekWS,
  hrefYear
} from '@/lib/calendar/links';
import { getEventsForWeek } from '@/lib/calendar/useCalendarData';
import { getDefaultPlanByStudentYear } from '@/data/durham/llb';
import { format } from 'date-fns';

const WeekGrid = dynamic(() => import('@/components/calendar/WeekGrid').then(m => ({ default: m.WeekGrid })), {
  ssr: false,
});

const WeekPage: React.FC = () => {
  const router = useRouter();
  const { y: yParam, ws: wsParam } = router.query;
  const { profile } = useAuth(); // NEW: Get profile from auth

  // Parse year from query
  const year: YearKey = useMemo(() => {
    return parseYearKey(typeof yParam === 'string' ? yParam : undefined);
  }, [yParam]);

  // Parse week start from query, with vacation period handling
  const weekStartISO: string = useMemo(() => {
    const plan = getDefaultPlanByStudentYear(year);
    const firstTeachingWeek = plan.termDates.michaelmas.weeks[0] || '2025-10-06';
    
    // If no specific week requested, check if we're in vacation and jump to first teaching week
    if (!wsParam) {
      const now = new Date();
     const today = format(now, 'yyyy-MM-dd');
      
      // Check if current date falls outside any teaching week
      const allTeachingWeeks = [
        ...plan.termDates.michaelmas.weeks,
        ...plan.termDates.epiphany.weeks,
        ...plan.termDates.easter.weeks
      ];
      
      const isInTeachingWeek = allTeachingWeeks.some(weekStart => {
        const weekStartDate = new Date(weekStart + 'T00:00:00.000Z');
        const weekEndDate = new Date(weekStartDate.getTime() + 6 * 24 * 60 * 60 * 1000);
        const todayDate = new Date(today + 'T00:00:00.000Z');
        return todayDate >= weekStartDate && todayDate <= weekEndDate;
      });
      
      // If not in any teaching week, default to first teaching week
      if (!isInTeachingWeek) {
        return firstTeachingWeek;
      }
    }
    
    return parseWeekStartParam(firstTeachingWeek, typeof wsParam === 'string' ? wsParam : undefined);
  }, [wsParam, year]);

  // Get student's actual year from profile (year_of_study)
  const studentYear: YearKey = useMemo(() => {
    const yearOfStudy = profile?.year_of_study || profile?.year_group;
    return parseYearKey(yearOfStudy);
  }, [profile]);
  
  const isOwnYear = year === studentYear;

  // Load events for the current week
  const events = useMemo(() => getEventsForWeek(year, weekStartISO), [year, weekStartISO]);

  // Navigation handlers
  const handlePrev = useCallback(() => {
    const prevWeek = addWeeksISO(weekStartISO, -1);
    router.push(hrefWeekWS(year, prevWeek));
  }, [router, year, weekStartISO]);

  const handleNext = useCallback(() => {
    const nextWeek = addWeeksISO(weekStartISO, 1);
    router.push(hrefWeekWS(year, nextWeek));
  }, [router, year, weekStartISO]);

  const handleBack = useCallback(() => {
    router.push(hrefYear(year));
  }, [router, year]);

  const title = `${YEAR_LABEL[year]} • Week View`;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={`Weekly calendar view for ${YEAR_LABEL[year]}`} />
      </Head>

      <WeekGrid
        yearKey={year}
        mondayISO={weekStartISO}
        events={events}
        onPrev={handlePrev}
        onNext={handleNext}
        onBack={handleBack}
        gated={!isOwnYear}
      />
    </>
  );
};

export default WeekPage;