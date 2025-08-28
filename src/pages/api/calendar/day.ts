// src/pages/api/calendar/day.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSupabase } from '@/lib/supabase/server'
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
    // Accept Authorization: Bearer <token> from the client
    const authHeader = String(req.headers.authorization || '')
    const bearerPrefix = 'Bearer '
    const token = authHeader.startsWith(bearerPrefix) ? authHeader.slice(bearerPrefix.length) : undefined

    const supabase = getServerSupabase(req, res)

    // If a token is present, ask Supabase to resolve the user with it.
    // (auth.getUser(token) works even if there is no cookie session.)
    const { data: userData, error: userErr } = token
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser()

    const user = userData?.user

    // DEMO MODE: if unauthenticated + demo enabled, return typed empty day
    if ((!user || userErr) && isDemoMode) {
      return res.status(200).json(emptyDayDetail(date))
    }

    // Otherwise require auth
    if (!user || userErr) {
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
              type: assessment.type === 'Problem Question' ? 'coursework' :
                    assessment.type === 'Moot' ? 'oral' :
                    assessment.type === 'Dissertation' ? 'coursework' :
                    assessment.type.toLowerCase() as 'essay' | 'presentation' | 'exam',
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

    const detail: DayDetail = {
      date: dateStr,
      day_name: dayName,
      is_today: isToday,
      events: [], // No longer generating fake lectures - these would come from official timetable
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
