import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useAuth } from '@/lib/supabase/AuthContext';
import { getSupabaseClient } from '@/lib/supabase/client';
import { EmptyState } from '@/components/common/EmptyState';
import YearView from '@/components/calendar/YearView';

type UserEvent = {
  id: string
  title: string
  start_at: string
  module_code: string | null
}

type UserAssessment = {
  id: string
  title: string
  due_at: string
  module_code: string | null
  assessment_type: string | null
}

export default function YearAtAGlancePage() {
  const router = useRouter();
  const { user } = useAuth() || { user: null };
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [assessments, setAssessments] = useState<UserAssessment[]>([]);

  // Default to Year 1 for now (user profile year selection can be added later)
  const userYearOfStudy = 1;

  // Fetch real user data for the academic year 2025-26
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return;

      try {
        // Academic year 2025-26: Sept 1, 2025 - Aug 31, 2026
        const yearStart = '2025-09-01';
        const yearEnd = '2026-08-31';

        // Fetch events
        const { data: eventsData, error: eventsError } = await supabase
          .from('user_events')
          .select('id, title, start_at, module_code')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .gte('start_at', yearStart)
          .lte('start_at', yearEnd)
          .order('start_at', { ascending: true });

        if (eventsError) {
          console.error('[YAAG] Error fetching events:', eventsError);
        }

        // Fetch assessments
        const { data: assessmentsData, error: assessmentsError } = await supabase
          .from('user_assessments')
          .select('id, title, due_at, module_code, assessment_type')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .gte('due_at', yearStart)
          .lte('due_at', yearEnd)
          .order('due_at', { ascending: true });

        if (assessmentsError) {
          console.error('[YAAG] Error fetching assessments:', assessmentsError);
        }

        console.log('[YAAG] Loaded real data:', eventsData?.length || 0, 'events,', assessmentsData?.length || 0, 'assessments');

        setEvents(eventsData || []);
        setAssessments(assessmentsData || []);
      } catch (error) {
        console.error('[YAAG] Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

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

  // Check if user has imported data
  const hasData = events.length > 0 || assessments.length > 0;

  if (!hasData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <EmptyState
          icon={<Calendar size={48} />}
          title="No Calendar Data Yet"
          description="Import your Blackboard calendar to see your year at a glance with all modules, lectures, and assignment deadlines."
          actionLabel="Import Calendar"
          actionHref="/onboarding/calendar"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Year at a Glance</h1>
          <p className="text-sm text-gray-600 mt-1">
            Academic Year 2025-26 • {events.length} events, {assessments.length} assessments imported
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

      {/* Eagle-Eye 3-Term Layout */}
      <YearView
        userYearOfStudy={userYearOfStudy}
        userEvents={events}
        userAssessments={assessments}
      />

      {/* Footer Note */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-400">
          💡 Click any assignment deadline to open the Assignment Widget
        </p>
      </div>
    </div>
  );
}
