import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { normalizeEvents } from '@/lib/calendar/normalize';
import type { NormalizedEvent } from '@/lib/calendar/normalize';
import type { YearKey } from '@/lib/calendar/links';
import { parseYearKey } from '@/lib/calendar/links';

/**
 * YAAG Events API - Merge Plan + Personal + Timetable
 * 
 * Returns normalized events for date range from:
 * 1. Durham Plan (static dataset, read-only)
 * 2. Personal items (DB, editable)
 * 3. Timetable events (DB, optional, read-only for now)
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ events: NormalizedEvent[] } | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Auth
    const supabase = createPagesServerClient({ req, res });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // Demo mode for unauthenticated (trial)
    const isDemo = process.env.NEXT_PUBLIC_DEMO_CALENDAR === 'true';
    if (!user) {
      if (authError || !isDemo) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      // Demo: return empty personal/timetable, only plan
      // (Plan is fetched client-side, so just return empty for consistency)
      return res.status(200).json({ events: [] });
    }

    // Parse query params
    const { yearKey: yearParam, from, to } = req.query;
    
    if (!from || !to || typeof from !== 'string' || typeof to !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid from/to dates (YYYY-MM-DD required)' });
    }

    const yearKey: YearKey = parseYearKey(typeof yearParam === 'string' ? yearParam : undefined);

    // Validate date format (basic)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(from) || !dateRegex.test(to)) {
      return res.status(400).json({ error: 'Invalid date format, use YYYY-MM-DD' });
    }

    // 1. GET DURHAM PLAN EVENTS (static, read-only)
    const planEvents = normalizeEvents(yearKey, {
      mode: 'month', // We'll use month mode regardless, filtering by from/to
      clampStartISO: from,
      clampEndISO: to,
      monthStartISO: from,
      monthEndISO: to,
    });

    // Mark plan events as read-only
    const planEventsWithMeta = planEvents.map(e => ({
      ...e,
      meta: {
        ...e.meta,
        source: 'plan',
        readOnly: true,
      },
    }));

    // 1a. GET PLAN OVERRIDES (student customizations)
    const { data: planOverrides } = await supabase
      .from('personal_items')
      .select('*')
      .eq('user_id', user.id)
      .not('original_plan_id', 'is', null)
      .gte('start_at', `${from}T00:00:00Z`)
      .lte('start_at', `${to}T23:59:59Z`);

    // Merge overrides into plan events
    const mergedPlanEvents = planEventsWithMeta.map(planEvent => {
      const override = (planOverrides || []).find(o => o.original_plan_id === planEvent.id);
      if (!override) return planEvent;

      return {
        ...planEvent,
        title: override.title || planEvent.title,
        meta: {
          ...planEvent.meta,
          source: 'plan_override',
          personalItemId: override.id,
          tutor: override.tutor,
          venue: override.venue,
          notes: override.notes,
          is_cancelled: override.is_cancelled,
          editable: true,
        },
      };
    });

    // 2. GET PERSONAL ITEMS (DB, editable)
    const { data: personalItems } = await supabase
      .from('personal_items')
      .select('*')
      .eq('user_id', user.id)
      .gte('start_at', `${from}T00:00:00Z`)
      .lte('start_at', `${to}T23:59:59Z`)
      .order('start_at', { ascending: true });

    const personalEvents: NormalizedEvent[] = (personalItems || []).map(item => {
      const startDate = new Date(item.start_at);
      const endDate = item.end_at ? new Date(item.end_at) : null;

      if (item.is_all_day) {
        // All-day event
        return {
          id: `personal-${item.id}`,
          title: item.title,
          date: item.start_at.substring(0, 10), // YYYY-MM-DD
          allDay: true,
          kind: 'topic' as const, // Reuse existing kind for compatibility
          meta: {
            source: 'personal',
            personalItemId: item.id,
            editable: true,
            type: item.type,
            priority: item.priority,
            completed: item.completed,
            notes: item.notes,
          },
        };
      } else {
        // Timed event
        const startTime = startDate.toISOString().substring(11, 16); // HH:mm
        const endTime = endDate ? endDate.toISOString().substring(11, 16) : undefined;
        
        return {
          id: `personal-${item.id}`,
          title: item.title,
          date: item.start_at.substring(0, 10),
          start: startTime,
          end: endTime,
          start_at: item.start_at,
          end_at: item.end_at || undefined,
          allDay: false,
          kind: 'topic' as const,
          meta: {
            source: 'personal',
            personalItemId: item.id,
            editable: true,
            type: item.type,
            priority: item.priority,
            completed: item.completed,
            notes: item.notes,
          },
        };
      }
    });

    // 3. GET ASSIGNMENTS (DB, user's homework/coursework)
    const {data: assignments} = await supabase
      .from('assignments')
      .select('*')
      .eq('user_id', user.id)
      .gte('due_date', from)
      .lte('due_date', to)
      .order('due_date', { ascending: true });

    const assignmentEvents: NormalizedEvent[] = (assignments || []).map(assignment => {
      // CRITICAL: Extract YYYY-MM-DD from due_date to match plan event format
      // due_date is stored as DATE type, but may include time component when queried
      // We need simple "2026-01-30" not "2026-01-30T04:00:00+00:00"
      const anyAssignment = assignment as any;
      const dateOnly = typeof anyAssignment.due_date === 'string' 
        ? anyAssignment.due_date.substring(0, 10)  // Extract YYYY-MM-DD
        : new Date(anyAssignment.due_date).toISOString().substring(0, 10);

      return {
        id: `assignment-${assignment.id}`,
        title: assignment.title,
        date: dateOnly,  // NOW MATCHES: "2026-01-30" format
        allDay: true, // Assignments are deadlines, not timed events
        kind: 'assessment' as const, // Use assessment kind (was deadline)
        meta: {
          source: 'assignment',
          assignmentId: assignment.id,
          editable: true, // Can edit/delete assignments
          module_id: assignment.module_id,
          question: assignment.question,
          status: assignment.status,
          progress: assignment.progress,
        },
      };
    });

    // 4. GET TIMETABLE EVENTS (optional, read-only for now)
    const { data: timetableEvents } = await supabase
      .from('timetable_events')
      .select('*')
      .eq('user_id', user.id)
      .gte('start_time', `${from}T00:00:00Z`)
      .lte('start_time', `${to}T23:59:59Z`)
      .order('start_time', { ascending: true });

    const timetableEventsNormalized: NormalizedEvent[] = (timetableEvents || []).map(evt => {
      const startDate = new Date(evt.start_time);
      const endDate = evt.end_time ? new Date(evt.end_time) : null;
      
      const startTime = startDate.toISOString().substring(11, 16); // HH:mm
      const endTime = endDate ? endDate.toISOString().substring(11, 16) : undefined;

      return {
        id: `timetable-${evt.id}`,
        title: evt.title,
        date: evt.start_time.substring(0, 10),
        start: startTime,
        end: endTime,
        start_at: evt.start_time,
        end_at: evt.end_time || undefined,
        allDay: false,
        kind: 'topic' as const,
        moduleCode: evt.module_code,
        meta: {
          source: 'timetable',
          timetableEventId: evt.id,
          readOnly: false, // Future: make editable
          location: evt.location,
        },
      };
    });

    // 5. MERGE ALL EVENTS
    const allEvents = [
      ...mergedPlanEvents,
      ...personalEvents,
      ...assignmentEvents,
      ...timetableEventsNormalized,
    ];

    // 5. DEDUPE by stable key (source + id + date)
    const seenKeys = new Set<string>();
    const dedupedEvents = allEvents.filter(e => {
      const key = `${e.meta?.source || 'unknown'}-${e.id}-${e.date}`;
      if (seenKeys.has(key)) return false;
      seenKeys.add(key);
      return true;
    });

    // 6. SORT by date, then start time
    dedupedEvents.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      if (a.start && b.start) return a.start.localeCompare(b.start);
      if (a.start) return -1; // Timed events before all-day
      if (b.start) return 1;
      return 0;
    });

    console.log(`[yaag/events] ✓ Returned ${dedupedEvents.length} events (plan=${planEventsWithMeta.length}, personal=${personalEvents.length}, assignments=${assignmentEvents.length}, timetable=${timetableEventsNormalized.length})`);

    return res.status(200).json({ events: dedupedEvents });

  } catch (error: any) {
    console.error('[yaag/events] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
