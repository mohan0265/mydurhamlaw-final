// src/pages/year-at-a-glance/week.tsx
'use client';
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/supabase/AuthContext';
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
import type { NormalizedEvent } from '@/lib/calendar/normalize';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { getDefaultPlanByStudentYear } from '@/data/durham/llb';

const WeekGrid = dynamic(() => import('@/components/calendar/WeekGrid').then(m => ({ default: m.WeekGrid })), {
  ssr: false,
});

const WeekPage: React.FC = () => {
  const router = useRouter();
  const { y: yParam, ws: wsParam } = router.query;
  const { userProfile } = useAuth();

  // State for merged events
  const [events, setEvents] = useState<NormalizedEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse year from query
  const year: YearKey = useMemo(() => {
    return parseYearKey(typeof yParam === 'string' ? yParam : undefined);
  }, [yParam]);

  // Parse week start from query
  const weekStartISO: string = useMemo(() => {
    const plan = getDefaultPlanByStudentYear(year);
    const firstTeachingWeek = plan.termDates.michaelmas.weeks[0] || '2025-10-06';
    
    if (!wsParam) {
      const now = new Date();
      const today = format(now, 'yyyy-MM-dd');
      const currentDate = new Date(today + 'T00:00:00.000Z');
      const dayOfWeek = currentDate.getUTCDay();
      const daysToMonday = dayOfWeek === 0 ? -6 : -(dayOfWeek - 1);
      const mondayDate = new Date(currentDate);
      mondayDate.setUTCDate(currentDate.getUTCDate() + daysToMonday);
      return mondayDate.toISOString().split('T')[0]!;
    }
    
    return parseWeekStartParam(firstTeachingWeek, typeof wsParam === 'string' ? wsParam : undefined);
  }, [wsParam, year]);

  // Fetch events from API (Part D implementation)
  useEffect(() => {
    let cancelled = false;

    async function fetchEvents() {
      setLoading(true);
      setError(null);

      try {
        // Compute from/to range for the week
        const weekStart = startOfWeek(new Date(weekStartISO + 'T00:00:00Z'), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(new Date(weekStartISO + 'T00:00:00Z'), { weekStartsOn: 1 });
        
        const from = format(weekStart, 'yyyy-MM-dd');
        const to = format(weekEnd, 'yyyy-MM-dd');

        const res = await fetch(`/api/yaag/events?yearKey=${year}&from=${from}&to=${to}`, {
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch events: ${res.statusText}`);
        }

        const data = await res.json();
        
        if (!cancelled) {
          setEvents(data.events || []);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('[week.tsx] Fetch error:', err);
        
        if (!cancelled) {
          setError(err.message);
          // Fallback to Plan-only
          const fallbackEvents = getEventsForWeek(year, weekStartISO);
          setEvents(fallbackEvents);
          setLoading(false);
        }
      }
    }

    fetchEvents();

    return () => {
      cancelled = true;
    };
  }, [year, weekStartISO]);

  const studentYear: YearKey = useMemo(() => {
    const yearOfStudy = userProfile?.year_of_study || userProfile?.year_group;
    return parseYearKey(yearOfStudy);
  }, [userProfile]);
  
  const isOwnYear = true;

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

  // Callback to refresh events
  const handleEventsChange = useCallback(() => {
    router.replace(router.asPath);
  }, [router]);

  // Navigate to month view
  const handleMonthView = useCallback(() => {
    const monthDate = new Date(weekStartISO + 'T00:00:00Z');
    const yearParam = year;
    const ymParam = format(monthDate, 'yyyy-MM');
    router.push(`/year-at-a-glance/month?y=${yearParam}&ym=${ymParam}`);
  }, [router, year, weekStartISO]);

  const title = `${YEAR_LABEL[year]} • Week View`;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={`Weekly calendar view for ${YEAR_LABEL[year]}`} />
      </Head>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-lg mb-4 text-sm">
          Personal items temporarily unavailable. Showing Plan only.
        </div>
      )}

      <WeekGrid
        yearKey={year}
        mondayISO={weekStartISO}
        events={events}
        onPrev={handlePrev}
        onNext={handleNext}
        onBack={handleBack}
        onMonthView={handleMonthView}
        gated={!isOwnYear}
        loading={loading}
        onEventsChange={handleEventsChange}
      />
    </>
  );
};

export default WeekPage;