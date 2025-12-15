import { useState, useEffect, useContext } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { AuthContext } from '@/lib/supabase/AuthContext';
import { format } from 'date-fns';
import { fetchAuthed } from '@/lib/fetchAuthed';

export type DurmahTask = {
  id: string;
  title: string;
  due: string; // ISO date string
  type: 'assignment' | 'exam' | 'other';
};

export type DurmahEvent = {
  id: string;
  title: string;
  start: string; // ISO datetime
  end: string;   // ISO datetime
  type: 'lecture' | 'seminar' | 'tutorial' | 'personal';
};

export function useDurmahDynamicContext() {
  const { user } = useContext(AuthContext);
  const [upcomingTasks, setUpcomingTasks] = useState<DurmahTask[]>([]);
  const [todaysEvents, setTodaysEvents] = useState<DurmahEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      setLoading(true);
      const supabase = getSupabaseClient();
      if (!supabase) return;

      try {
        const today = new Date();
        const todayStr = format(today, 'yyyy-MM-dd');
        
        // 1. Fetch Assignments (due in future)
        const { data: assignments } = await supabase
          .from('assignments')
          .select('id, title, due_date')
          .eq('user_id', user.id)
          .gte('due_date', todayStr)
          .order('due_date', { ascending: true })
          .limit(5);

        if (assignments) {
          setUpcomingTasks(assignments.map(a => ({
            id: a.id,
            title: a.title,
            due: a.due_date,
            type: 'assignment'
          })));
        }

        // 2. Fetch Today's Events (via API to reuse calendar logic if possible, or direct DB)
        // For simplicity and speed, we'll try to fetch from the 'calendar_events' table if it exists,
        // or rely on the /api/calendar/day endpoint which aggregates everything.
        // Using the API is safer to get the unified view (timetable + personal).
        
        const res = await fetchAuthed(`/api/calendar/day?date=${todayStr}`);
        if (res.status === 401 || res.status === 403) {
          setAuthError(true);
          setTodaysEvents([]);
          setUpcomingTasks((prev) => prev ?? []);
          setLoading(false);
          return;
        }

        if (res.ok) {
          const dayData = await res.json();
          // dayData.events is expected to be an array
          if (dayData.events && Array.isArray(dayData.events)) {
            setTodaysEvents(dayData.events.map((e: any) => ({
              id: e.id,
              title: e.title,
              start: e.start_time || e.start, // Handle potential variations
              end: e.end_time || e.end,
              type: e.type || 'personal'
            })));
          }
        }

      } catch (err) {
        console.error("Failed to fetch dynamic context for Durmah", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  return { upcomingTasks, todaysEvents, loading, authError };
}
