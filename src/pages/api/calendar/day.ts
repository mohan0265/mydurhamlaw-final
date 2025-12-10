// src/pages/api/calendar/day.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSupabase, getServerUser } from '@/lib/api/serverAuth'
import { DayDetail } from '@/types/calendar'
import { format } from 'date-fns'
import { DURHAM_LLB_2025_26, getDefaultPlanByStudentYear } from '@/data/durham/llb'

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { date, programme = 'LLB', year = '1' } = req.query
  if (!date || typeof date !== 'string') {
    return res.status(400).json({ message: 'Missing date parameter' })
  }

  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_CALENDAR === 'true'
  
  // Get term dates and assessments from dataset
  const yearOfStudy = Number(year) || 1
  const normalizedYearGroup = yearOfStudy === 0 ? 'foundation' : `year${yearOfStudy}` as 'foundation'|'year1'|'year2'|'year3'
  const plan = getDefaultPlanByStudentYear(normalizedYearGroup)

  try {
    console.log(`[CalendarAPI] Request for date=${date}. Checking auth...`)

    // Use the shared helper which tries cookies first, then falls back to Authorization header
    const { user } = await getServerUser(req, res)

    console.log(`[CalendarAPI] User found: ${user?.id || 'none'}`)

    // DEMO MODE: if unauthenticated + demo enabled, return typed empty day
    if (!user && isDemoMode) {
      console.log('[CalendarAPI] Returning demo mode data (unauthenticated)')
      return res.status(200).json(emptyDayDetail(date as string))
    }

    // Otherwise require auth
    if (!user) {
      console.warn('[CalendarAPI] Returning 401 Unauthorized - No user found via cookies or header')
      return res.status(401).json({ message: 'Unauthorized' })
    }

    // ----- Mock real data (typed) -----
    const d = new Date(date)
    const dateStr = format(d, 'yyyy-MM-dd')
    const dayName = format(d, 'EEEE')
    const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr

    // Find assessments due on this specific date
    const assessments_due = plan.modules.flatMap((module, moduleIndex) =>
      module.assessments
        .map((assessment, assessmentIndex) => {
          // Handle different assessment types with different due date formats
          let assessmentDate: string | null = null
          if ('due' in assessment) {
            assessmentDate = format(new Date(assessment.due), 'yyyy-MM-dd')
          } else if ('window' in assessment) {
            // For exams, use the start of the window
            assessmentDate = format(new Date(assessment.window.start), 'yyyy-MM-dd')
          }
          
          if (assessmentDate === dateStr) {
            return {
              id: `assessment-${moduleIndex}-${assessmentIndex}`,
              module_id: String(moduleIndex + 1),
              title: `${module.title} ${assessment.type}`,
              type: (assessment.type === 'Problem Question' ? 'coursework' :
                    assessment.type === 'Moot' ? 'oral' :
                    assessment.type === 'Dissertation' ? 'coursework' :
                    assessment.type === 'Essay' ? 'essay' :
                    assessment.type === 'Exam' ? 'exam' :
                    assessment.type === 'Presentation' ? 'presentation' :
                    'coursework') as 'essay' | 'exam' | 'coursework' | 'presentation' | 'oral',
              due_at: `${dateStr}T23:59:59Z`,
              weight_percentage: assessment.weight || 0,
              description: assessment.type === 'Essay' ? 'Essay submission' : 
                           assessment.type === 'Problem Question' ? 'Problem question submission' : 
                           assessment.type === 'Exam' ? 'Examination' :
                           `${assessment.type} submission`,
              status: 'not_started' as const,
            }
          }
          return null
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
    )

    // Fetch timetable events
    const supabase = getServerSupabase(req, res)
    const { data: dbTimetableEvents } = await supabase
      .from('timetable_events')
      .select('*')
      .eq('user_id', user.id)

    const events: CalendarEvent[] = [];
    
    if (dbTimetableEvents) {
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
