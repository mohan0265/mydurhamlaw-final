// src/pages/year-at-a-glance/index.tsx
// Simplified YAAG - Real Data Only (No Templates)
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/supabase/AuthContext';
import { getSupabaseClient } from '@/lib/supabase/client';
import { EmptyState } from '@/components/common/EmptyState';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';

// Types for real data
type UserEvent = {
  id: string;
  title: string;
  start_at: string;
  end_at: string | null;
  event_type: string | null;
  module_code: string | null;
  all_day: boolean;
  location: string | null;
};

type UserAssessment = {
  id: string;
  title: string;
  due_at: string;
  module_code: string | null;
  assessment_type: string | null;
  weight_percentage: number | null;
};

// Month card component
function MonthCard({ 
  month, 
  events, 
  assessments 
}: { 
  month: Date; 
  events: UserEvent[]; 
  assessments: UserAssessment[];
}) {
  const monthName = format(month, 'MMMM yyyy');
  const totalItems = events.length + assessments.length;

  if (totalItems === 0) {
    return (
      <div className="rounded-xl border bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{monthName}</h3>
        <p className="text-sm text-gray-400 italic">No events this month</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{monthName}</h3>
        <span className="text-sm text-gray-500">{totalItems} items</span>
      </div>

      <div className="space-y-2">
        {/* Assessments first (priority) */}
        {assessments.map(a => (
          <Link
            key={a.id}
            href={`/assignments?open=${a.id}`}
            className="block p-3 rounded-lg border border-red-100 bg-red-50 hover:bg-red-100 transition-colors group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-sm font-semibold text-red-900">{a.title}</div>
                {a.module_code && (
                  <div className="text-xs text-red-700 mt-1">{a.module_code}</div>
                )}
              </div>
              <div className="text-xs text-red-600 font-medium ml-2">
                {format(new Date(a.due_at), 'MMM d')}
              </div>
            </div>
          </Link>
        ))}

        {/* Events */}
        {events.slice(0, 5).map(e => (
          <div
            key={e.id}
            className="p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{e.title}</div>
                {e.module_code && (
                  <div className="text-xs text-gray-600 mt-1">{e.module_code}</div>
                )}
                {e.location && (
                  <div className="text-xs text-gray-500 mt-1">📍 {e.location}</div>
                )}
              </div>
              <div className="text-xs text-gray-600 ml-2">
                {e.all_day ? format(new Date(e.start_at), 'MMM d') : format(new Date(e.start_at), 'MMM d, h:mm a')}
              </div>
            </div>
          </div>
        ))}

        {events.length > 5 && (
          <div className="text-xs text-gray-400 text-center py-2">
            +{events.length - 5} more events
          </div>
        )}
      </div>
    </div>
  );
}

export default function YearAtAGlancePage() {
  const router = useRouter();
  const { user } = useAuth() || { user: null };
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [assessments, setAssessments] = useState<UserAssessment[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Academic year calculation (Sept-Aug)
  const academicYearStart = new Date(currentDate.getFullYear(), 8, 1); // Sept 1
  const academicYearEnd = new Date(currentDate.getFullYear() + 1, 7, 31); // Aug 31

  // Fetch real data
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return;

      try {
        // Fetch events for academic year
        const { data: eventsData } = await supabase
          .from('user_events')
          .select('*')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .gte('start_at', academicYearStart.toISOString())
          .lte('start_at', academicYearEnd.toISOString())
          .order('start_at', { ascending: true });

        // Fetch assessments for academic year
        const { data: assessmentsData } = await supabase
          .from('user_assessments')
          .select('*')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .gte('due_at', academicYearStart.toISOString())
          .lte('due_at', academicYearEnd.toISOString())
          .order('due_at', { ascending: true });

        setEvents(eventsData || []);
        setAssessments(assessmentsData || []);
      } catch (error) {
        console.error('[YAAG] Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id, academicYearStart, academicYearEnd]);

  // Group events and assessments by month
  const monthsData = React.useMemo(() => {
    const months: Map<string, { events: UserEvent[]; assessments: UserAssessment[]; date: Date }> = new Map();

    // Generate 12 months from academic year start
    for (let i = 0; i < 12; i++) {
      const month = addMonths(academicYearStart, i);
      const key = format(month, 'yyyy-MM');
      months.set(key, { events: [], assessments: [], date: month });
    }

    // Distribute events into months
    events.forEach(event => {
      const eventDate = new Date(event.start_at);
      const key = format(eventDate, 'yyyy-MM');
      if (months.has(key)) {
        months.get(key)!.events.push(event);
      }
    });

    // Distribute assessments into months
    assessments.forEach(assessment => {
      const dueDate = new Date(assessment.due_at);
      const key = format(dueDate, 'yyyy-MM');
      if (months.has(key)) {
        months.get(key)!.assessments.push(assessment);
      }
    });

    return Array.from(months.values());
  }, [events, assessments, academicYearStart]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-8" />
        <div className="grid md:grid-cols-3 gap-6">
          {[0, 1, 2].map(i => (
            <div key={i} className="rounded-xl border bg-white p-6 h-64 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state if no data
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

  if (events.length === 0 && assessments.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <EmptyState
          icon={<Calendar size={48} />}
          title="No Calendar Data Yet"
          description="Import your Blackboard calendar to see your lectures, seminars, and assignment deadlines here."
          actionLabel="Import Calendar"
          actionHref="/onboarding/calendar"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Year at a Glance</h1>
          <p className="text-sm text-gray-600 mt-1">
            Academic Year {format(academicYearStart, 'yyyy')}-{format(academicYearEnd, 'yyyy')} •{' '}
            {events.length} events, {assessments.length} assessments
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

      {/* Month Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {monthsData.map(({ date, events: monthEvents, assessments: monthAssessments }) => (
          <MonthCard
            key={format(date, 'yyyy-MM')}
            month={date}
            events={monthEvents}
            assessments={monthAssessments}
          />
        ))}
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
