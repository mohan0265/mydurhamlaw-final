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
    const { from, to } = req.query
    if (!from || !to || typeof from !== 'string' || typeof to !== 'string') {
      return res.status(400).json({ message: 'Missing from or to date parameters' })
    }

    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_CALENDAR === 'true'
    const fromDate = new Date(from)

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

          // Mock events (placeholder; replace with DB data later)
          const mockEvents: Array<{
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

          if (inMonth && Math.random() > 0.7) {
            mockEvents.push({
              id: `event-${dateStr}`,
              title: 'Contract Law Lecture',
              description: 'Weekly lecture',
              start_at: `${dateStr}T10:00:00Z`,
              end_at: `${dateStr}T11:00:00Z`,
              location: 'Lecture Hall A',
              type: 'lecture',
              module_id: '3',
              is_university_fixed: true,
              is_all_day: false,
            })
          }

          if (inMonth && Math.random() > 0.9) {
            mockEvents.push({
              id: `assessment-${dateStr}`,
              title: 'Essay Due',
              description: 'Constitutional Law Essay',
              start_at: `${dateStr}T23:59:00Z`,
              end_at: `${dateStr}T23:59:00Z`,
              location: '',
              type: 'assessment',
              module_id: '2',
              is_university_fixed: true,
              is_all_day: true,
            })
          }

          return {
            date: dateStr,
            events: mockEvents,
            is_current_month: inMonth,
            is_today: isToday,
            has_exam: mockEvents.some(e => e.type === 'exam'),
            has_assessment: mockEvents.some(e => e.type === 'assessment'),
            has_lecture: mockEvents.some(e => e.type === 'lecture'),
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
