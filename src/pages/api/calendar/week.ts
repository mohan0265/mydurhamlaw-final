// src/pages/api/calendar/week.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSupabase } from '@/lib/supabase/server'
import { CalendarEvent, PersonalItem } from '@/types/calendar'
import { format, addDays, startOfWeek } from 'date-fns'

// Custom date utility to replace missing isWithinInterval
function isWithinInterval(date: Date, interval: { start: Date; end: Date }): boolean {
  return date >= interval.start && date <= interval.end;
}
import { DURHAM_LLB_2025_26, getDefaultPlanByStudentYear } from '@/data/durham/llb'

// Force this API to use Node.js runtime instead of Edge Runtime
export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { from, to, programme = 'LLB', year = '1' } = req.query
    if (!from || !to || typeof from !== 'string' || typeof to !== 'string') {
      return res.status(400).json({ message: 'Missing from or to date parameters' })
    }

    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_CALENDAR === 'true'
    
    // Get term dates to filter events
    const yearOfStudy = Number(year) || 1
    const normalizedYearGroup = yearOfStudy === 0 ? 'foundation' : `year${yearOfStudy}` as 'foundation'|'year1'|'year2'|'year3'
    const plan = getDefaultPlanByStudentYear(normalizedYearGroup)
    
    // Helper to check if a date is within any term
    const isWithinTermTime = (date: Date) => {
      return (
        isWithinInterval(date, { start: new Date(plan.termDates.michaelmas.start), end: new Date(plan.termDates.michaelmas.end) }) ||
        isWithinInterval(date, { start: new Date(plan.termDates.epiphany.start), end: new Date(plan.termDates.epiphany.end) }) ||
        isWithinInterval(date, { start: new Date(plan.termDates.easter.start), end: new Date(plan.termDates.easter.end) })
      )
    }

    // --- AUTH (supports Bearer token or cookie) ---
    const authHeader = String(req.headers.authorization || '')
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : undefined

    const supabase = getServerSupabase(req, res)
    const { data: userData, error: authError } = token
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser()
    const user = userData?.user

    // DEMO MODE: unauthenticated → return a valid, typed empty payload
    if ((!user || authError) && isDemoMode) {
      return res.status(200).json({ events: [], personal_items: [] })
    }

    // Normal auth required when not in demo mode
    if (!user || authError) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
    // --- END AUTH ---

    const fromDate = new Date(from)
    const weekStart = startOfWeek(fromDate, { weekStartsOn: 1 })

    // Only generate events from dataset assessments within term time
    const events: CalendarEvent[] = []
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i)
      const dateStr = format(day, 'yyyy-MM-dd')

      // Only add assessment events that are due on this specific date
      plan.modules.forEach((module, moduleIndex) => {
        module.assessments.forEach((assessment, assessmentIndex) => {
          // Handle different assessment types with different due date formats
          let assessmentDate: string | null = null
          if ('due' in assessment) {
            assessmentDate = format(new Date(assessment.due), 'yyyy-MM-dd')
          } else if ('window' in assessment) {
            // For exams, use the start of the window
            assessmentDate = format(new Date(assessment.window.start), 'yyyy-MM-dd')
          }
          
          if (assessmentDate === dateStr) {
            events.push({
              id: `assessment-${moduleIndex}-${assessmentIndex}`,
              title: `${module.title} ${assessment.type}`,
              description: assessment.type === 'Exam' ? 'Examination' : `${assessment.type} due`,
              start_at: `${dateStr}T23:59:00Z`,
              end_at: `${dateStr}T23:59:00Z`,
              location: '',
              type: assessment.type === 'Exam' ? 'exam' : 'assessment',
              module_id: String(moduleIndex + 1),
              is_university_fixed: true,
              is_all_day: true,
            })
          }
        })
      })

      // No longer generating mock lectures - these would come from official timetable data later
    }

    // Fetch personal items from Supabase (real data, not mock)
    // For now, return empty array - personal items will come from Supabase queries later
    const personal_items: PersonalItem[] = []

    return res.status(200).json({ events, personal_items })
  } catch (error) {
    console.error('Error fetching week data:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
