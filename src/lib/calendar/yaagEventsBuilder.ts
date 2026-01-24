// src/lib/calendar/yaagEventsBuilder.ts
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { normalizeEvents, type NormalizedEvent } from './normalize';
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Shared YAAG Events Builder
 * 
 * Fetches and merges:
 * 1. Durham Plan (static, read-only)
 * 2. Plan Overrides (student customizations)
 * 3. Personal Items (student-created)
 * 4. Assignments (as deadline events)
 * 5. Timetable Events (optional)
 * 
 * Used by both /api/yaag/events and /api/durmah/context
 */

interface YAAGEventsOptions {
  req: NextApiRequest;
  res: NextApiResponse;
  yearKey?: string;
  fromDate: string;  // YYYY-MM-DD
  toDate: string;    // YYYY-MM-DD
  userId: string;
  supabase?: any; // Pre-initialized client
}

export async function buildYAAGEvents(options: YAAGEventsOptions): Promise<NormalizedEvent[]> {
  const { req, res, yearKey = 'year1', fromDate, toDate, userId, supabase: providedSupabase } = options;
  
  const supabase = providedSupabase || createPagesServerClient({ req, res });
  const from = fromDate;
  const to = toDate;

  // 1. GET DURHAM PLAN EVENTS (static, read-only)
  const planEvents = normalizeEvents(yearKey as any, {
    mode: 'month',
    clampStartISO: from,
    clampEndISO: to,
    monthStartISO: from,
    monthEndISO: to,
  });

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
    .eq('user_id', userId)
    .not('original_plan_id', 'is', null)
    .gte('start_at', `${from}T00:00:00Z`)
    .lte('start_at', `${to}T23:59:59Z`);

  // Merge overrides into plan events
  const mergedPlanEvents = planEventsWithMeta.map((planEvent: NormalizedEvent) => {
    const override = (planOverrides || []).find((o: any) => o.original_plan_id === planEvent.id);
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
    .eq('user_id', userId)
    .is('original_plan_id', null)  // Only non-override personal items
    .gte('start_at', `${from}T00:00:00Z`)
    .lte('start_at', `${to}T23:59:59Z`)
    .order('start_at', { ascending: true });

  const personalEvents: NormalizedEvent[] = (personalItems || []).map((item: any) => {
    const startDate = new Date(item.start_at);
    const endDate = item.end_at ? new Date(item.end_at) : null;

    if (item.is_all_day) {
      return {
        id: `personal-${item.id}`,
        title: item.title,
        date: item.start_at.substring(0, 10),
        allDay: true,
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
    } else {
      const startTime = startDate.toISOString().substring(11, 16);
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
    .eq('user_id', userId)
    .gte('due_date', from)
    .lte('due_date', to)
    .order('due_date', { ascending: true });

  const assignmentEvents: NormalizedEvent[] = (assignments || []).map((assignment: any) => {
    const dateOnly = typeof assignment.due_date === 'string' 
      ? assignment.due_date.substring(0, 10)
      : assignment.due_date;

    return {
      id: `assignment-${assignment.id}`,
      title: assignment.title,
      date: dateOnly,
      allDay: true,
      kind: 'assessment' as const,
      meta: {
        source: 'assignment',
        assignmentId: assignment.id,
        editable: true,
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
    .eq('user_id', userId)
    .gte('start_time', `${from}T00:00:00Z`)
    .lte('start_time', `${to}T23:59:59Z`)
    .order('start_time', { ascending: true });

  const timetableEventsNormalized: NormalizedEvent[] = (timetableEvents || []).map((evt: any) => {
    const start = new Date(evt.start_time);
    const end = evt.end_time ? new Date(evt.end_time) : null;

    return {
      id: `timetable-${evt.id}`,
      title: evt.title,
      date: start.toISOString().substring(0, 10),
      start: start.toISOString().substring(11, 16),
      end: end ? end.toISOString().substring(11, 16) : undefined,
      start_at: evt.start_time,
      end_at: evt.end_time || undefined,
      allDay: false,
      kind: 'topic' as const,
      moduleCode: evt.module_code || undefined,
      meta: {
        source: 'timetable',
        timetableId: evt.id,
        readOnly: true,
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

  // 6. DEDUPE by stable key
  const seenKeys = new Set<string>();
  const dedupedEvents = allEvents.filter((e: NormalizedEvent) => {
    const key = `${e.meta?.source || 'unknown'}-${e.id}-${e.date}`;
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });

  // 7. SORT by date, then start time
  dedupedEvents.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.start && b.start) return a.start.localeCompare(b.start);
    return 0;
  });

  return dedupedEvents;
}

/**
 * Group events by date
 */
export function groupEventsByDate(events: NormalizedEvent[]): Record<string, NormalizedEvent[]> {
  const grouped: Record<string, NormalizedEvent[]> = {};
  
  for (const event of events) {
    if (!grouped[event.date]) {
      grouped[event.date] = [];
    }
    grouped[event.date]!.push(event);
  }
  
  return grouped;
}
