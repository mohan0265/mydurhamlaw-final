// src/pages/year-at-a-glance/calendar.tsx
// Enhanced YAAG page with Month/Week views matching Durham University MyTimetable UX

import React, { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { Calendar, LayoutGrid, List, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/supabase/AuthContext';
import { getSupabaseClient } from '@/lib/supabase/client';
import { EmptyState } from '@/components/common/EmptyState';
import MonthViewDurham from '@/components/calendar/MonthViewDurham';
import WeekViewDurham from '@/components/calendar/WeekViewDurham';
import PersonalItemModal from '@/components/calendar/PersonalItemModal';
import type { NormalizedEvent } from '@/lib/calendar/normalize';

type ViewMode = 'month' | 'week';

type UserEvent = {
  id: string;
  title: string;
  start_at: string;
  end_at?: string;
  module_code?: string;
  location?: string;
  event_type?: string;
  external_id?: string;
};

type UserAssessment = {
  id: string;
  title: string;
  due_at: string;
  module_code?: string;
  assessment_type?: string;
};

// Convert database records to NormalizedEvent format
function normalizeEvents(
  events: UserEvent[],
  assessments: UserAssessment[]
): NormalizedEvent[] {
  const result: NormalizedEvent[] = [];
  
  // Process timetable events
  for (const ev of events) {
    const startDate = new Date(ev.start_at);
    const dateStr = format(startDate, 'yyyy-MM-dd');
    const startTime = format(startDate, 'HH:mm');
    const endTime = ev.end_at ? format(new Date(ev.end_at), 'HH:mm') : undefined;
    
    result.push({
      id: ev.id,
      date: dateStr,
      title: ev.title,
      start: startTime,
      end: endTime,
      kind: 'topic',
      allDay: false,
      meta: {
        source: 'timetable',
        module_code: ev.module_code,
        location: ev.location,
        event_type: ev.event_type,
      }
    });
  }
  
  // Process assessments as deadline events
  for (const ass of assessments) {
    const dueDate = new Date(ass.due_at);
    const dateStr = format(dueDate, 'yyyy-MM-dd');
    const dueTime = format(dueDate, 'HH:mm');
    
    result.push({
      id: `ass-${ass.id}`,
      date: dateStr,
      title: ass.title,
      start: dueTime,  // Use start for display in cards
      kind: 'assessment',
      allDay: false,
      meta: {
        source: 'assignment',
        module_code: ass.module_code,
        assignmentId: ass.id,
        assessment_type: ass.assessment_type,
        dueTime,  // Store due time in meta
        submissionUrl: 'https://blackboard.durham.ac.uk', // Default fallback for deep link
      }
    });
  }
  
  return result;
}

export default function YAAGCalendarPage() {
  const router = useRouter();
  const { user } = useAuth() || { user: null };
  
  const [view, setView] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<NormalizedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalDate, setAddModalDate] = useState<string>();
  
  // Fetch events for the visible date range
  const fetchEvents = useCallback(async (date: Date) => {
    if (!user?.id) return;
    
    const supabase = getSupabaseClient();
    if (!supabase) return;
    
    setLoading(true);
    
    try {
      // Calculate date range based on view
      let from: Date, to: Date;
      if (view === 'month') {
        from = startOfMonth(date);
        to = endOfMonth(date);
      } else {
        from = startOfWeek(date, { weekStartsOn: 1 });
        to = endOfWeek(date, { weekStartsOn: 1 });
      }
      
      const fromStr = format(from, 'yyyy-MM-dd');
      const toStr = format(to, 'yyyy-MM-dd');
      
      // Fetch events
      const { data: eventsData, error: eventsError } = await supabase
        .from('user_events')
        .select('id, title, start_at, end_at, module_code, location, event_type, external_id')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .gte('start_at', `${fromStr}T00:00:00`)
        .lte('start_at', `${toStr}T23:59:59`)
        .order('start_at', { ascending: true });
      
      if (eventsError) {
        console.error('[YAAG Calendar] Events error:', eventsError);
      }
      
      // Fetch assessments
      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from('user_assessments')
        .select('id, title, due_at, module_code, assessment_type')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .gte('due_at', `${fromStr}T00:00:00`)
        .lte('due_at', `${toStr}T23:59:59`)
        .order('due_at', { ascending: true });
      
      if (assessmentsError) {
        console.error('[YAAG Calendar] Assessments error:', assessmentsError);
      }
      
      const normalized = normalizeEvents(
        (eventsData || []) as UserEvent[],
        (assessmentsData || []) as UserAssessment[]
      );
      
      setEvents(normalized);
    } catch (error) {
      console.error('[YAAG Calendar] Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, view]);
  
  // Fetch when date or view changes
  useEffect(() => {
    fetchEvents(currentDate);
  }, [currentDate, view, fetchEvents]);
  
  // Handlers
  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
  };
  
  const handleBack = () => {
    router.push('/year-at-a-glance');
  };
  
  const handleAddEvent = (date: string) => {
    setAddModalDate(date);
    setShowAddModal(true);
  };
  
  const handleEventClick = (event: NormalizedEvent) => {
    // Handle assignment clicks - navigate to assignment page with openAssessmentId
    // This triggers the "Create Assignment from Deadline" flow in AssignmentsPage
    if (event.meta?.source === 'assignment' && event.meta.assignmentId) {
      router.push(`/assignments?openAssessmentId=${event.meta.assignmentId}`);
    }
    // Add other event type handling as needed
  };
  
  const handleModalSave = () => {
    setShowAddModal(false);
    fetchEvents(currentDate);
  };
  
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <EmptyState
          icon={<Calendar size={48} />}
          title="Login Required"
          description="Please log in to view your calendar"
          actionLabel="Go to Login"
          actionHref="/login"
        />
      </div>
    );
  }
  
  return (
    <>
      <Head>
        <title>Calendar - MyDurhamLaw</title>
        <meta name="description" content="Your academic calendar with lectures and assignments" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Page header with view toggle */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-purple-600 hover:text-purple-700 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back to Overview</span>
              </button>
            </div>
            
            {/* View toggle buttons */}
            <div className="flex items-center bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
              <button
                onClick={() => setView('month')}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition
                  ${view === 'month' 
                    ? 'bg-purple-600 text-white shadow' 
                    : 'text-gray-600 hover:bg-gray-100'}
                `}
              >
                <LayoutGrid className="w-4 h-4" />
                Month
              </button>
              <button
                onClick={() => setView('week')}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition
                  ${view === 'week' 
                    ? 'bg-purple-600 text-white shadow' 
                    : 'text-gray-600 hover:bg-gray-100'}
                `}
              >
                <List className="w-4 h-4" />
                Week
              </button>
            </div>
          </div>
          
          {/* Empty state / Sync prompt */}
          {!loading && events.length === 0 && (
             <div className="mb-6 p-4 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl border border-purple-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
               <div>
                  <h3 className="font-bold text-purple-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Your calendar looks empty
                  </h3>
                  <p className="text-sm text-purple-700 mt-1">
                    Connect your MyTimetable and Blackboard calendars to see all your lectures and deadlines here.
                  </p>
               </div>
               <button 
                  onClick={() => router.push('/onboarding/sync-wizard')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 whitespace-nowrap shadow-sm transition-colors"
               >
                  Sync Calendars
               </button>
             </div>
          )}

          {/* Calendar views */}
          {view === 'month' ? (
            <MonthViewDurham
              events={events}
              currentMonth={currentDate}
              onMonthChange={handleDateChange}
              onAddEvent={handleAddEvent}
              onEventClick={handleEventClick}
              loading={loading}
            />
          ) : (
            <WeekViewDurham
              events={events}
              currentWeek={currentDate}
              onWeekChange={handleDateChange}
              onAddEvent={handleAddEvent}
              onEventClick={handleEventClick}
              loading={loading}
            />
          )}
        </div>
      </div>
      
      {/* Personal Item Modal */}
      <PersonalItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleModalSave}
        mode="create"
        initialDate={addModalDate}
      />
    </>
  );
}
