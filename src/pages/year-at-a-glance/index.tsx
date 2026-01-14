import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Calendar, Plus } from 'lucide-react';
import { useAuth } from '@/lib/supabase/AuthContext';
import { getSupabaseClient } from '@/lib/supabase/client';
import { EmptyState } from '@/components/common/EmptyState';
import YearView from '@/components/calendar/YearView';
import UnifiedAddModal from '@/components/calendar/UnifiedAddModal';

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
  const [showAddModal, setShowAddModal] = useState(false);

  // Default to Year 1 for now (user profile year selection can be added later)
  const userYearOfStudy = 1;

  // Fetch real user data for the academic year 2025-26
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    if (!user?.id) return;
    
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
        .order('due_at', { ascending: true});

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
  
  // Check if onboarding banner should be shown (stored in localStorage)
  const [showOnboardingBanner, setShowOnboardingBanner] = useState(true);
  
  useEffect(() => {
    const dismissed = localStorage.getItem('yaag_onboarding_dismissed');
    if (dismissed) {
      // Re-show banner after 3 days
      const dismissedAt = parseInt(dismissed, 10);
      const threeDays = 3 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedAt < threeDays) {
        setShowOnboardingBanner(false);
      }
    }
  }, []);

  const dismissOnboardingBanner = () => {
    localStorage.setItem('yaag_onboarding_dismissed', Date.now().toString());
    setShowOnboardingBanner(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 relative">
      {/* Onboarding Banner - shown when no data and not dismissed */}
      {!hasData && showOnboardingBanner && (
        <div className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-5 relative">
          <button
            onClick={dismissOnboardingBanner}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 p-1"
            title="Dismiss"
          >
            ×
          </button>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="flex-grow">
              <h3 className="font-bold text-gray-900 text-lg">📅 Make YAAG Your Study Powerhouse!</h3>
              <p className="text-sm text-gray-600 mt-1">
                Import your Blackboard calendar to see all your lectures, seminars and deadlines at a glance. 
                Don't have it yet? No worries - explore the structure first!
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
              <Link
                href="/onboarding/calendar"
                className="px-5 py-2.5 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 transition-colors text-center"
              >
                Import Calendar
              </Link>
              <button
                onClick={dismissOnboardingBanner}
                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors"
              >
                Set Up Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Year at a Glance</h1>
          <p className="text-sm text-gray-600 mt-1">
            {hasData 
              ? `Academic Year 2025-26 • ${events.length} events, ${assessments.length} assessments imported`
              : 'Academic Year 2025-26 • Explore your academic year structure'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!hasData && (
            <Link
              href="/onboarding/calendar"
              className="px-4 py-2 rounded-xl border border-purple-200 text-purple-600 bg-white hover:bg-purple-50 text-sm font-medium transition-all"
            >
              ➕ Import Calendar
            </Link>
          )}
          <Link
            href="/year-at-a-glance/calendar"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 text-sm font-medium transition-all shadow-md hover:shadow-lg"
          >
            📅 Open Calendar View
          </Link>
        </div>
      </div>

      {/* Eagle-Eye 3-Term Layout - Always shown, even if empty */}
      <YearView
        userYearOfStudy={userYearOfStudy}
        userEvents={events}
        userAssessments={assessments}
      />

      {/* Empty state hint (shown inside the view when no data) */}
      {!hasData && (
        <div className="mt-6 text-center bg-white/80 backdrop-blur-sm rounded-xl py-4 px-6 border border-gray-100 max-w-md mx-auto">
          <p className="text-sm text-gray-500">
            💡 <span className="font-medium">Tip:</span> Click on any week to see details. 
            Once you import your calendar, events will appear in their respective weeks.
          </p>
        </div>
      )}

      {/* Footer Note */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-400">
          💡 Click any week to view details • Click assignments to open Widget • Use + to add items
        </p>
      </div>

      {/* Floating + Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 hover:scale-110 transition-all flex items-center justify-center z-40 group"
        title="Add item (Personal or Assignment)"
      >
        <Plus size={28} />
        <span className="absolute right-full mr-3 px-3 py-1.5 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none">
          Add Personal Item or Assignment
        </span>
      </button>

      {/* Unified Add Modal */}
      <UnifiedAddModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={() => {
          // Refresh data after save
          fetchData();
          setShowAddModal(false);
        }}
      />
    </div>
  );
}
