// src/pages/api/calendar/day.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { DayDetail } from '@/types/calendar'
import { format } from 'date-fns'
import { getApiAuth, getBearerToken } from '@/lib/apiAuth'

// Force Node.js runtime (Netlify/Next)
export const config = { runtime: 'nodejs' }

/** Build a typed-empty DayDetail for demo mode / unauthenticated */
function emptyDayDetail(dateISO: string): DayDetail {
  const d = new Date(dateISO)
  const dateStr = format(d, 'yyyy-MM-dd')
  const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr

  return {
    date: dateStr,
    day_name: format(d, 'EEEE'),
    is_today: isToday,
    events: [],
    assessments_due: [],
    exams: [],
    personal_items: [],
    study_time_blocks: [],
  }
}

function setDiagnostics(
  res: NextApiResponse,
  tokenSource: 'header' | 'cookie' | 'none',
  cookieNames: string[]
) {
  res.setHeader('x-mdl-auth-seen', tokenSource === 'header' ? 'bearer' : tokenSource);
  res.setHeader('x-mdl-token-source', tokenSource);
  res.setHeader('x-mdl-cookie-names', cookieNames.join(','));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { date, programme = 'LLB', year = '1' } = req.query
  if (!date || typeof date !== 'string') {
    return res.status(400).json({ message: 'Missing date parameter' })
  }

  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_CALENDAR === 'true'

  try {
    console.log(`[CalendarAPI] Request for date=${date}. Checking auth...`)

    const tokenInfo = getBearerToken(req)
    if (!tokenInfo.token && isDemoMode) {
      console.log('[CalendarAPI] Returning demo mode data (unauthenticated)')
      return res.status(200).json(emptyDayDetail(date as string))
    }

    const auth = await getApiAuth(req)
    if (auth.status === 'missing_token' || auth.status === 'invalid_token') {
      setDiagnostics(res, auth.tokenSource, auth.cookieNames)
      return res.status(401).json({ error: auth.status })
    }
    if (auth.status === 'misconfigured') {
      setDiagnostics(res, auth.tokenSource, auth.cookieNames)
      return res.status(500).json({ error: 'server_misconfigured' })
    }
    const { user, supabase } = auth

    console.log(`[CalendarAPI] User found: ${user?.id || 'none'}`);

    // Query ONLY real user data from database
    const dateStr = format(new Date(date), 'yyyy-MM-dd');
    const dayName = format(new Date(date), 'EEEE');
    const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr;

    // Fetch real assessments due on this date
    const { data: assessmentsData } = await supabase
      .from('user_assessments')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .gte('due_at', `${dateStr}T00:00:00Z`)
      .lte('due_at', `${dateStr}T23:59:59Z`);

    const assessments_due = (assessmentsData || []).map(a => ({
      id: a.id,
      module_id: a.module_code || 'unknown',
      title: a.title,
      type: (a.assignment_type === 'essay' ? 'essay' :
             a.assignment_type === 'exam' ? 'exam' :
             a.assignment_type === 'presentation' ? 'presentation' :
             'coursework') as 'essay' | 'exam' | 'coursework' | 'presentation' | 'oral',
      due_at: a.due_at,
      weight_percentage: a.weight_percentage || 0,
      description: a.description || '',
      status: 'not_started' as const,
    }));

    // Fetch real events for this date
    const { data: eventsData } = await supabase
      .from('user_events')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .gte('start_at', `${dateStr}T00:00:00Z`)
      .lte('start_at', `${dateStr}T23:59:59Z`);

    const events: CalendarEvent[] = (eventsData || []).map(e => ({
      id: e.id,
      title: e.title,
      description: e.description || '',
      start_at: e.start_at,
      end_at: e.end_at || e.start_at,
      location: e.location || '',
      type: e.event_type || 'other',
      module_id: e.module_code || 'general',
      is_university_fixed: e.source === 'ics',
      is_all_day: e.all_day || false,
    }));

    // Fetch timetable events (weekly recurring)
    const { data: dbTimetableEvents } = await supabase
      .from('timetable_events')
      .select('*')
      .eq('user_id', user.id);

    if (dbTimetableEvents) {
      const d = new Date(date);
      const dayOfWeek = d.getDay();
      const getTimeString = (iso: string) => {
        const parts = new Date(iso).toISOString().split('T');
        return (parts[1] || "00:00:00").substring(0, 5);
      };

      dbTimetableEvents.forEach((evt) => {
        const evtDate = new Date(evt.start_time);
        if (evt.recurrence_pattern === 'weekly') {
          if (evtDate.getDay() === dayOfWeek) {
            const startHM = getTimeString(evt.start_time);
            const endHM = getTimeString(evt.end_time);

            events.push({
              id: evt.id,
              title: evt.title,
              description: evt.location ? `Location: ${evt.location}` : '',
              start_at: `${dateStr}T${startHM}:00Z`,
              end_at: `${dateStr}T${endHM}:00Z`,
              location: evt.location || '',
              type: 'lecture',
              module_id: 'timetable',
              is_university_fixed: true,
              is_all_day: false
            });
          }
        }
      });
    }

    const detail: DayDetail = {
      date: dateStr,
      day_name: dayName,
      is_today: isToday,
      events,
      assessments_due,
      exams: [],
      personal_items: [], // Will come from Supabase queries later
      study_time_blocks: [],
    }

    return res.status(200).json(detail)
  } catch (err) {
    console.error('Error fetching day detail:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
