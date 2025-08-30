// src/pages/api/calendar/month.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSupabase } from '@/lib/supabase/server'
import type { MonthData } from '@/types/calendar'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
} from 'date-fns'

// Custom date utility to replace missing isWithinInterval
function isWithinInterval(date: Date, interval: { start: Date; end: Date }): boolean {
  return date >= interval.start && date <= interval.end;
}
import { DURHAM_LLB_2025_26, getDefaultPlanByStudentYear } from '@/data/durham/llb'

// Force this API to run on Node (not Edge)
export const config = { runtime: 'nodejs' }

// Inclusive list of dates between start and end
const daysInInterval = (start: Date, end: Date): Date[] => {
  const out: Date[] = []
  const d = new Date(start); d.setHours(0, 0, 0, 0)
  const last = new Date(end); last.setHours(0, 0, 0, 0)
  while (d.getTime() <= last.getTime()) {
    out.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return out
}

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
    const fromDate = new Date(from)
    
    // Get term dates to filter events
    const yearOfStudy = Number(year) || 1
    const normalizedYearGroup = yearOfStudy === 0 ? 'foundation' : `year${yearOfStudy}` as 'foundation'|'year1'|'year2'|'year3'
    const plan = getDefaultPlanByStudentYear(normalizedYearGroup)
    
    // Helper to check if a date is within any term
    const isWithinTermTime = (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd')
      return (
        isWithinInterval(date, { start: new Date(plan.termDates.michaelmas.start), end: new Date(plan.termDates.michaelmas.end) }) ||
        isWithinInterval(date, { start: new Date(plan.termDates.epiphany.start), end: new Date(plan.termDates.epiphany.end) }) ||
        isWithinInterval(date, { start: new Date(plan.termDates.easter.start), end: new Date(plan.termDates.easter.end) })
      )
    }

    // --- AUTH (supports Authorization: Bearer <token>) ---
    const authHeader = String(req.headers.authorization || '')
    const bearerPrefix = 'Bearer '
    const token = authHeader.startsWith(bearerPrefix) ? authHeader.slice(bearerPrefix.length) : undefined

    const supabase = getServerSupabase(req, res)
    const { data: userData, error: authError } = token
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser()
    const user = userData?.user

    // DEMO MODE: unauthenticated -> typed empty payload
    if ((!user || authError) && isDemoMode) {
      const emptyMonth: MonthData = {
        year: fromDate.getFullYear(),
        month: fromDate.getMonth() + 1,
        weeks: [],
      }
      return res.status(200).json(emptyMonth)
    }

    if (!user || authError) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
    // --- END AUTH ---

    // Build calendar range for the month containing `from`
    const monthStart = startOfMonth(fromDate)
    const monthEnd = endOfMonth(fromDate)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    const allDays = daysInInterval(calendarStart, calendarEnd)

    // Group by weeks (chunks of 7)
    const weeks: MonthData['weeks'] = []
    for (let i = 0; i < allDays.length; i += 7) {
      const weekDays = allDays.slice(i, i + 7)
      if (weekDays.length === 0) continue

      const firstDay = weekDays[0]
      if (!firstDay) continue

      const week = {
        week_start: format(firstDay, 'yyyy-MM-dd'),
        days: weekDays.map((day: Date) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const inMonth = isSameMonth(day, fromDate)
          const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr

          // Generate events only from dataset assessments and personal items
          const events: Array<{
            id: string
            title: string
            description: string
            start_at: string
            end_at: string
            location: string
            type: 'lecture' | 'assessment' | 'exam'
            module_id: string
            is_university_fixed: boolean
            is_all_day: boolean
          }> = []

          // Only add assessments that are due on this specific date
          if (inMonth) {
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
          }

          // No longer generating random lecture events - they will come from Supabase personal items later

          return {
            date: dateStr,
            events: events,
            is_current_month: inMonth,
            is_today: isToday,
            has_exam: events.some(e => e.type === 'exam'),
            has_assessment: events.some(e => e.type === 'assessment'),
            has_lecture: events.some(e => e.type === 'lecture'),
          }
        }),
      }
      weeks.push(week)
    }

    const monthData: MonthData = {
      year: fromDate.getFullYear(),
      month: fromDate.getMonth() + 1,
      weeks,
    }

    return res.status(200).json(monthData)
  } catch (error) {
    console.error('Error fetching month data:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
