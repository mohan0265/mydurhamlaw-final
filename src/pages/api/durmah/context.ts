import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import type { StudentContext } from '@/types/durmahContext';
import { buildYAAGEvents, groupEventsByDate } from '@/lib/calendar/yaagEventsBuilder';
import { DEFAULT_TZ, formatNowPacket, getDaysLeft, dateToDayKey, type NowPacket } from '@/lib/durmah/timezone';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * DURMAH CENTRAL INTELLIGENCE - YAAG Integration
 * 
 * Now includes YAAG calendar data (Plan + Personal + Timetable + Assignments)
 * indexed by date so Durmah can answer:
 * - "What's on Wed 28 Jan?"
 * - "What classes this week?"
 * - "Deadlines before Friday?"
 * 
 * Query Params:
 * - focusDate: YYYY-MM-DD (default: today)
 * - rangeDays: number (default: 14)
 * - rangeStart/rangeEnd: YYYY-MM-DD (overrides focusDate+rangeDays)
 * - pageHint: dashboard|yaag-week|yaag-month|assignments
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StudentContext | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let user: any = null;
    let authMethod: 'cookie' | 'bearer' | 'none' = 'none';
    let supabaseClient: any = null;

    // TRY METHOD 1: Cookie-based auth
    try {
      supabaseClient = createPagesServerClient({ req, res });
      const { data: { user: cookieUser }, error } = await supabaseClient.auth.getUser();
      if (cookieUser && !error) {
        user = cookieUser;
        authMethod = 'cookie';
        console.log('[context] ✓ Auth via cookies');
      }
    } catch (err) {
      console.warn('[context] Cookie auth failed:', err);
    }

    // TRY METHOD 2: Bearer token (if cookies failed)
    if (!user) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          supabaseClient = createClient(SUPABASE_URL, ANON_KEY, {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false },
          });
          const { data: { user: bearerUser }, error } = await supabaseClient.auth.getUser(token);
          if (bearerUser && !error) {
            user = bearerUser;
            authMethod = 'bearer';
            console.log('[context] ✓ Auth via bearer token');
          }
        } catch (err) {
          console.warn('[context] Bearer auth failed:', err);
        }
      }
    }

    // BOTH methods failed
    if (!user || !supabaseClient) {
      console.error('[context] ✗ Auth failed (both cookie and bearer)');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // PARSE QUERY PARAMS for date range
    const { focusDate, rangeDays, rangeStart, rangeEnd, pageHint } = req.query;
    
    // TIMEZONE TRUTH: Single source of NOW (Europe/London)
    const timeZone = DEFAULT_TZ;
    const now = new Date();
    const nowPacket: NowPacket = formatNowPacket(now, timeZone);
    const todayKey = nowPacket.dayKey;
    
    console.log(`[context] NOW: ${nowPacket.nowText} (timezone: ${timeZone})`);
    
    let fromDate: string;
    let toDate: string;

    if (typeof rangeStart === 'string' && typeof rangeEnd === 'string') {
      fromDate = rangeStart;
      toDate = rangeEnd;
    } else {
      const focus = typeof focusDate === 'string' ? new Date(focusDate) : now;
      const days = typeof rangeDays === 'string' ? parseInt(rangeDays) : 14;
      
      // Use timezone-aware date keys
      const focusDayKey = dateToDayKey(focus, timeZone);
      
      // Default: focus date minus 3 days to focus date plus (days-3) days
      const startOffset = new Date(focus);
      startOffset.setDate(startOffset.getDate() - 3);
      const endOffset = new Date(focus);
      endOffset.setDate(endOffset.getDate() + (days - 3));
      
      fromDate = dateToDayKey(startOffset, timeZone);
      toDate = dateToDayKey(endOffset, timeZone);
    }

    console.log(`[context] YAAG range: ${fromDate} to ${toDate}, pageHint=${pageHint || 'dashboard'}`);

    // FETCH: User profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('display_name, year_group, year_of_study')
      .eq('id', user.id)
      .maybeSingle();

    // FETCH: Assignments (EXACT same query as assignments.tsx line 42)
    const { data: assignmentsData } = await supabaseClient
      .from('assignments')
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true });

    // Categorize assignments with RICH METADATA for Durmah intelligence
    const assignments = assignmentsData || [];
    
    // Helper: calculate days left using TIMEZONE-AWARE computation
    const calcDaysLeft = (dueDate: string) => {
      return getDaysLeft(todayKey, dueDate, timeZone);
    };
    
    // Enrich assignments with computed fields
    const enrichAssignment = (a: any) => ({
      id: a.id,
      title: a.title,
      module_name: a.module_name,
      module_code: a.module_code,
      due_date: a.due_date,
      daysLeft: a.due_date ? calcDaysLeft(a.due_date) : null,
      status: a.status || 'not_started',
      current_stage: a.current_stage || 0,
      estimated_effort_hours: a.estimated_effort_hours,
      nextAction: (a.current_stage || 0) === 0 ? 'start' : 'continue',
      question_text: a.question_text,
      assignment_type: a.assignment_type,
    });
    
    const upcoming = assignments
      .filter(a => 
        a.due_date && new Date(a.due_date) >= now && a.status !== 'completed'
      )
      .map(enrichAssignment)
      .slice(0, 10); // Increased from 5 to 10 for better context
    
    const overdue = assignments
      .filter(a =>
        a.due_date && new Date(a.due_date) < now && a.status !== 'completed'
      )
      .map(enrichAssignment)
      .slice(0, 5);
    
    const recentlyCreated = assignments
      .filter(a => new Date(a.created_at) > new Date(now.getTime() - 7*24*60*60*1000))
      .map(enrichAssignment)
      .slice(0, 3);



    // FETCH: Today's classes (legacy, keep for backwards compat)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    
    const { data: todaysEvents } = await supabaseClient
      .from('timetable_events')
      .select('title, start_time, end_time, location, module_code')
      .eq('user_id', user.id)
      .gte('start_time', todayStart.toISOString())
      .lte('start_time', todayEnd.toISOString())
      .order('start_time', { ascending: true});

    // FETCH: YAAG EVENTS (CENTRAL INTELLIGENCE!)
    const yaagEvents = await buildYAAGEvents({
      req,
      res,
      yearKey: profile?.year_of_study || 'year1',
      fromDate,
      toDate,
      userId: user.id,
    });

    const itemsByDay = groupEventsByDate(yaagEvents);

    // Convert to simplified format for Durmah
    const simplifiedItemsByDay: Record<string, Array<{
      type: string;
      title: string;
      start?: string;
      end?: string;
      allDay: boolean;
      meta?: any;
    }>> = {};

    for (const [date, events] of Object.entries(itemsByDay)) {
      simplifiedItemsByDay[date] = events.map(e => ({
        type: e.meta?.source || 'unknown',
        title: e.title,
        start: e.start,
        end: e.end,
        allDay: e.allDay,
        meta: {
          moduleCode: e.moduleCode,
          kind: e.kind,
          ...e.meta,
        },
      }));
    }

    // Build response with TIMEZONE TRUTH embedded
    const studentContext: StudentContext = {
      student: {
        displayName: profile?.display_name || user.email?.split('@')[0] || 'Student',
        yearGroup: profile?.year_of_study || profile?.year_group || 'Year 1',
        term: 'Epiphany',  // TODO: Compute from academic calendar
        weekOfTerm: 3,     // TODO: Compute from academic calendar
        localTimeISO: nowPacket.isoUTC,
        timezone: timeZone,
      },
      // TIMEZONE TRUTH: academic.now is the SINGLE SOURCE for date/time
      academic: {
        timezone: timeZone,
        now: nowPacket,
      },
      assignments: {
        upcoming,
        overdue,
        recentlyCreated,
        total: assignments.length,
      },
      schedule: {
        todaysClasses: (todaysEvents || []).map(e => ({
          module_name: e.title,
          time: `${new Date(e.start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone })} - ${e.end_time ? new Date(e.end_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone }) : ''}`,
        })),
      },
      yaag: {
        rangeStart: fromDate,
        rangeEnd: toDate,
        itemsByDay: simplifiedItemsByDay,
      },
    };

    console.log(`[context] ✓ SUCCESS: yaag events=${yaagEvents.length}, dates covered=${Object.keys(itemsByDay).length}, assignments=${studentContext.assignments.total}`);
    
    return res.status(200).json(studentContext);

  } catch (error: any) {
    console.error('[context] ✗ Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
