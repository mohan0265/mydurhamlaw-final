// src/pages/year-at-a-glance/index.tsx
// YAAG 3-Term Layout - Real Data Only
import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Calendar, Upload, Plus } from 'lucide-react';
import { useAuth } from '@/lib/supabase/AuthContext';
import { getSupabaseClient } from '@/lib/supabase/client';
import { EmptyState } from '@/components/common/EmptyState';
import TermColumnReal from '@/components/calendar/TermColumnReal';

// Academic year bounds (Sept 1 - Aug 31)
const ACADEMIC_YEARS = [
  { key: '2024-25', label: '2024-25', startDate: new Date(2024, 8, 1), endDate: new Date(2025, 7, 31) },
  { key: '2025-26', label: '2025-26', startDate: new Date(2025, 8, 1), endDate: new Date(2026, 7, 31) },
  { key: '2026-27', label: '2026-27', startDate: new Date(2026, 8, 1), endDate: new Date(2027, 7, 31) },
];

// Term dates within academic year (approximate Durham dates)
const TERM_DATES = {
  'michaelmas': { startMonth: 9, startDay: 20, endMonth: 11, endDay: 15 }, // Oct ~20 - Dec ~15
  'epiphany': { startMonth: 0, startDay: 10, endMonth: 2, endDay: 15 }, // Jan ~10 - Mar ~15
  'easter': { startMonth: 3, startDay: 15, endMonth: 5, endDay: 20 }, // Apr ~15 - Jun ~20
};

function getTermDates(academicYearKey: string, termKey: keyof typeof TERM_DATES) {
  const yearParts = academicYearKey.split('-');
  const yearStart = parseInt(yearParts[0] || '2025'); // Default to 2025 if parsing fails
  const termConfig = TERM_DATES[termKey];
  
  // Michaelmas is in the first year, Epiphany/Easter in the second year
  const year = termKey === 'michaelmas' ? yearStart : yearStart + 1;
  
  return {
    start: new Date(year, termConfig.startMonth, termConfig.startDay),
    end: new Date(year, termConfig.endMonth, termConfig.endDay),
  };
}

type UserEvent = {
  id: string;
  title: string;
  start_at: string;
  module_code: string | null;
  event_type: string | null;
};

type UserAssessment = {
  id: string;
  title: string;
  due_at: string;
  module_code: string | null;
  assessment_type: string | null;
};

export default function YearAtAGlancePage() {
  const router = useRouter();
  const { user } = useAuth() || { user: null };
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [assessments, setAssessments] = useState<UserAssessment[]>([]);
  
  // Selected academic year (default to current 2025-26)
  const [selectedYear, setSelectedYear] = useState('2025-26');

  // Fetch real data for selected academic year
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return;

      try {
        const yearConfig = ACADEMIC_YEARS.find(y => y.key === selectedYear);
        if (!yearConfig) return;

        // Fetch events within academic year
        const { data: eventsData, error: eventsError } = await supabase
          .from('user_events')
          .select('id, title, start_at, module_code, event_type')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .gte('start_at', yearConfig.startDate.toISOString())
          .lte('start_at', yearConfig.endDate.toISOString())
          .order('start_at', { ascending: true });

        if (eventsError) {
          console.error('[YAAG] Error fetching events:', eventsError);
        }

        // Fetch assessments within academic year
        const { data: assessmentsData, error: assessmentsError } = await supabase
          .from('user_assessments')
          .select('id, title, due_at, module_code, assessment_type')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .gte('due_at', yearConfig.startDate.toISOString())
          .lte('due_at', yearConfig.endDate.toISOString())
          .order('due_at', { ascending: true});

        if (assessmentsError) {
          console.error('[YAAG] Error fetching assessments:', assessmentsError);
        }

        console.log('[YAAG] Loaded for', selectedYear, ':', eventsData?.length || 0, 'events,', assessmentsData?.length || 0, 'assessments');
        
        setEvents(eventsData || []);
        setAssessments(assessmentsData || []);
      } catch (error) {
        console.error('[YAAG] Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id, selectedYear]);

  // Filter events/assessments by term
  const termData = useMemo(() => {
    const michaelmas = getTermDates(selectedYear, 'michaelmas');
    const epiphany = getTermDates(selectedYear, 'epiphany');
    const easter = getTermDates(selectedYear, 'easter');

    const filterByTerm = (items: any[], dateField: string, start: Date, end: Date) => {
      return items.filter(item => {
        const itemDate = new Date(item[dateField]);
        return itemDate >= start && itemDate <= end;
      });
    };

    return {
      michaelmas: {
        events: filterByTerm(events, 'start_at', michaelmas.start, michaelmas.end),
        assessments: filterByTerm(assessments, 'due_at', michaelmas.start, michaelmas.end),
        ...michaelmas,
      },
      epiphany: {
        events: filterByTerm(events, 'start_at', epiphany.start, epiphany.end),
        assessments: filterByTerm(assessments, 'due_at', epiphany.start, epiphany.end),
        ...epiphany,
      },
      easter: {
        events: filterByTerm(events, 'start_at', easter.start, easter.end),
        assessments: filterByTerm(assessments, 'due_at', easter.start, easter.end),
        ...easter,
      },
    };
  }, [events, assessments, selectedYear]);

  // Year navigation
  const currentYearIndex = ACADEMIC_YEARS.findIndex(y => y.key === selectedYear);
  const canGoPrev = currentYearIndex > 0;
  const canGoNext = currentYearIndex < ACADEMIC_YEARS.length - 1;

  const handlePrevYear = () => {
    if (canGoPrev && currentYearIndex > 0) {
      const prevYear = ACADEMIC_YEARS[currentYearIndex - 1];
      if (prevYear) {
        setSelectedYear(prevYear.key);
      }
    }
  };

  const handleNextYear = () => {
    if (canGoNext && currentYearIndex < ACADEMIC_YEARS.length - 1) {
      const nextYear = ACADEMIC_YEARS[currentYearIndex + 1];
      if (nextYear) {
        setSelectedYear(nextYear.key);
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-8" />
        <div className="grid md:grid-cols-3 gap-6">
          {[0, 1, 2].map(i => (
            <div key={i} className="rounded-2xl border bg-white p-6 h-96 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state for users with no calendar import
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <EmptyState
          icon={<Calendar size={48} />}
          title="Login Required"
          description="Please log in to view your year at a glance"
          actionLabel="Go to Login"
          actionHref="/login"
        />
      </div>
    );
  }

  const hasAnyData = events.length > 0 || assessments.length > 0;

  if (!hasAnyData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <EmptyState
          icon={<Calendar size={48} />}
          title="No Calendar Data Yet"
          description="Import your Blackboard calendar to see your year at a glance with all modules, lectures, and assignment deadlines."
          actionLabel="Import Calendar"
          actionHref="/onboarding/calendar"
        />
        
        {/* Additional CTAs */}
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/assignments"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
          >
            <Plus size={16} />
            Add Assignment
          </Link>
          <Link
            href="/assignments"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
          >
            <Upload size={16} />
            Upload Brief PDF
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Year at a Glance</h1>
            <p className="text-sm text-gray-600 mt-1">
              Academic Year {selectedYear} • {events.length} events, {assessments.length} assessments
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/year-at-a-glance/month"
              className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors"
            >
              Month View
            </Link>
            <Link
              href="/year-at-a-glance/week"
              className="px-4 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 text-sm font-medium transition-colors"
            >
              Week View
            </Link>
          </div>
        </div>

        {/* Year Navigation */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={handlePrevYear}
            disabled={!canGoPrev}
            className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Previous academic year"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex-1 grid grid-cols-3 gap-2">
            {ACADEMIC_YEARS.map(year => (
              <button
                key={year.key}
                onClick={() => setSelectedYear(year.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectedYear === year.key
                    ? 'bg-purple-600 text-white'
                    : 'bg-white border hover:bg-gray-50 text-gray-700'
                }`}
              >
                {year.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleNextYear}
            disabled={!canGoNext}
            className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Next academic year"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* 3-Term Layout */}
      <div className="grid md:grid-cols-3 gap-6">
        <TermColumnReal
          termKey="michaelmas"
          title="Michaelmas"
          startDate={termData.michaelmas.start}
          endDate={termData.michaelmas.end}
          events={termData.michaelmas.events}
          assessments={termData.michaelmas.assessments}
        />
        
        <TermColumnReal
          termKey="epiphany"
          title="Epiphany"
          startDate={termData.epiphany.start}
          endDate={termData.epiphany.end}
          events={termData.epiphany.events}
          assessments={termData.epiphany.assessments}
        />
        
        <TermColumnReal
          termKey="easter"
          title="Easter (Revision & Exams)"
          startDate={termData.easter.start}
          endDate={termData.easter.end}
          events={termData.easter.events}
          assessments={termData.easter.assessments}
        />
      </div>

      {/* Footer Note */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-400">
          💡 Click any assignment to open the Assignment Widget and continue your work
        </p>
      </div>
    </div>
  );
}
