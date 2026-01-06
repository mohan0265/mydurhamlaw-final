// src/pages/year-at-a-glance/month.tsx
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
  parseYMParam,
  prevYM,
  nextYM,
  hrefMonthYM,
  hrefYear,
  getAcademicStartMonth,
  getAcademicYearFor
} from '@/lib/calendar/links';
import type { YM } from '@/lib/calendar/links';
import { getEventsForMonth } from '@/lib/calendar/useCalendarData';
import type { NormalizedEvent } from '@/lib/calendar/normalize';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const MonthGrid = dynamic(() => import('@/components/calendar/MonthGrid').then(m => ({ default: m.MonthGrid })), {
  ssr: false,
});

const MonthPage: React.FC = () => {
  const router = useRouter();
  const { y: yParam, ym: ymParam } = router.query;
  const { userProfile } = useAuth();

  // State for merged events
  const [events, setEvents] = useState<NormalizedEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse year from query
  const year: YearKey = useMemo(() => {
    return parseYearKey(typeof yParam === 'string' ? yParam : undefined);
  }, [yParam]);

  // Parse month from query
  const ym: YM = useMemo(() => {
    if (!ymParam) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      return { year: currentYear, month: currentMonth };
    }
    
    const academicStartMonth = getAcademicStartMonth(year);
    const academicYear = getAcademicYearFor(year);
    const fallback: YM = { 
      year: academicYear, 
      month: academicStartMonth
    };
    return parseYMParam(fallback, typeof ymParam === 'string' ? ymParam : undefined);
  }, [ymParam, year]);

  // Fetch events from API (Part D implementation)
  useEffect(() => {
    let cancelled = false;

    async function fetchEvents() {
      setLoading(true);
      setError(null);

      try {
        // Compute from/to range for the month
        const monthStart = startOfMonth(new Date(ym.year, ym.month - 1));
        const monthEnd = endOfMonth(new Date(ym.year, ym.month - 1));
        
        const from = format(monthStart, 'yyyy-MM-dd');
        const to = format(monthEnd, 'yyyy-MM-dd');

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
        console.error('[month.tsx] Fetch error:', err);
        
        if (!cancelled) {
          setError(err.message);
          // Fallback to Plan-only (static)
          const fallbackEvents = getEventsForMonth(year, ym);
          setEvents(fallbackEvents);
          setLoading(false);
        }
      }
    }

    fetchEvents();

    return () => {
      cancelled = true;
    };
  }, [year, ym]);

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

  // Callback to refresh events after personal item changes
  const handleEventsChange = useCallback(() => {
    // Re-trigger fetch
    router.replace(router.asPath);
  }, [router]);

  const studentYear: YearKey = useMemo(() => {
    const yearOfStudy = userProfile?.year_of_study || userProfile?.year_group;
    return parseYearKey(yearOfStudy);
  }, [userProfile]);
  
  const isOwnYear = true; // Allow all years for now

  const title = `${YEAR_LABEL[year]} • Month View`;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={`Monthly calendar view for ${YEAR_LABEL[year]}`} />
      </Head>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-lg mb-4 text-sm">
          Personal items temporarily unavailable. Showing Plan only.
        </div>
      )}

      <MonthGrid
        yearKey={year}
        ym={ym}
        events={events}
        onPrev={handlePrev}
        onNext={handleNext}
        onBack={handleBack}
        gated={!isOwnYear}
        loading={loading}
        onEventsChange={handleEventsChange}
      />
    </>
  );
};

export default MonthPage;