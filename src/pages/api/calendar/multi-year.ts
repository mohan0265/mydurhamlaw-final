// src/pages/api/calendar/multi-year.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSupabase, getServerUser } from '@/lib/api/serverAuth'
import { MultiYearData, YearOverview, Module } from '@/types/calendar'
import {
  DURHAM_LLB_2025_26,
  AcademicYearPlan,
} from '@/data/durham/llb'

const yearKeyToNumber = (y: unknown): number => {
  if (typeof y === 'number') return y
  if (typeof y === 'string') {
    const s = y.trim().toLowerCase()
    if (s.includes('foundation')) return 0
    const m = s.match(/\d+/)
    if (m) return Number(m[0])
    const n = Number(s)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

// Force Node runtime (not Edge)
export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { programme = 'LLB', academicYear = '2025/26' } = req.query

    // --- AUTH (supports Authorization: Bearer <token>) ---
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_CALENDAR === 'true'
    const { user, error: authError, supabase } = await getServerUser(req, res)

    // DEMO MODE: unauthenticated -> typed empty payload
    if ((!user || authError) && isDemoMode) {
      const demo: MultiYearData = {
        programme: String(programme),
        academic_year: String(academicYear),
        current_year_index: 1,
        year_labels: ['Foundation', 'Year 1', 'Year 2', 'Year 3'],
        years: { foundation: null, year1: null, year2: null, year3: null },
      }
      return res.status(200).json(demo)
    }

    if (!user || authError) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
    // --- END AUTH ---

    // Read user profile to find the current year
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type, year_group')
      .eq('id', user.id)
      .single()

    const currentYearMapping: Record<string, number> = {
      foundation: 0,
      year1: 1,
      year2: 2,
      year3: 3,
    }

    const userType = profile?.user_type || profile?.year_group || 'year1'
    const normalizedUserType = userType.toLowerCase().replace(/\s/g, '')
    const currentYearIndex = currentYearMapping[normalizedUserType] ?? 1

    // Build YearOverview from Durham data
    const createYearDataFromDurham = (
      durhamPlan: AcademicYearPlan,
      yearIndex: number
    ): YearOverview => {
      const isCurrentOrPast = yearIndex <= currentYearIndex
      const isCurrent = yearIndex === currentYearIndex

      const michaelmasModules = durhamPlan.modules
        .filter(
          (m) =>
            m.delivery === 'Michaelmas' || m.delivery === 'Michaelmas+Epiphany'
        )
        .map((m) => convertDurhamModule(m, durhamPlan.yearKey, 1))

      const epiphanyModules = durhamPlan.modules
        .filter(
          (m) =>
            m.delivery === 'Epiphany' || m.delivery === 'Michaelmas+Epiphany'
        )
        .map((m) => convertDurhamModule(m, durhamPlan.yearKey, 2))

      const nextDeadline = isCurrent ? findNextDeadline(durhamPlan) : undefined
      const upcomingEvents = isCurrent ? generateUpcomingEvents(durhamPlan) : []

      return {
        academic_year: '2025/26',
        programme: String(programme),
        year_of_study: yearIndex,
        term_1: {
          name: 'Michaelmas Term',
          start_date: durhamPlan.termDates.michaelmas.start,
          end_date: durhamPlan.termDates.michaelmas.end,
          modules: michaelmasModules,
          progress_percentage: isCurrentOrPast
            ? calculateTermProgress(yearIndex, 1, currentYearIndex)
            : 0,
        },
        term_2: {
          name: 'Epiphany Term',
          start_date: durhamPlan.termDates.epiphany.start,
          end_date: durhamPlan.termDates.epiphany.end,
          modules: epiphanyModules,
          progress_percentage: isCurrentOrPast
            ? calculateTermProgress(yearIndex, 2, currentYearIndex)
            : 0,
        },
        term_3: {
          name: 'Easter Term',
          start_date: durhamPlan.termDates.easter.start,
          end_date: durhamPlan.termDates.easter.end,
          modules: [], // revision/exams
          progress_percentage: isCurrentOrPast
            ? calculateTermProgress(yearIndex, 3, currentYearIndex)
            : 0,
        },
        overall_progress: isCurrentOrPast
          ? calculateOverallProgress(yearIndex, currentYearIndex)
          : 0,
        next_deadline: nextDeadline,
        upcoming_events: upcomingEvents,
      }
    }

    const multiYearData: MultiYearData = {
      current_year_index: currentYearIndex,
      year_labels: ['Foundation', 'Year 1', 'Year 2', 'Year 3'],
      programme: String(programme),
      academic_year: String(academicYear),
      years: {
        foundation: createYearDataFromDurham(DURHAM_LLB_2025_26.foundation, 0),
        year1: createYearDataFromDurham(DURHAM_LLB_2025_26.year1, 1),
        year2: createYearDataFromDurham(DURHAM_LLB_2025_26.year2, 2),
        year3: createYearDataFromDurham(DURHAM_LLB_2025_26.year3, 3),
      },
    }

    return res.status(200).json(multiYearData)
  } catch (error) {
    console.error('Error fetching multi-year overview:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

/* -------------------- Helpers -------------------- */

function convertDurhamModule(durhamModule: any, yearKey: string, semester: number): Module {
  return {
    id:
      durhamModule.code ||
      `${yearKey}-${durhamModule.title.replace(/\s+/g, '-').toLowerCase()}`,
    code:
      durhamModule.code ||
      `${yearKey.toUpperCase()}${semester}${durhamModule.title
        .substring(0, 3)
        .toUpperCase()}`,
    title: durhamModule.title,
    credits: durhamModule.credits,
    programme: 'LLB',
    year: yearKeyToNumber(yearKey),
    semester: semester as 1 | 2 | 3,
    description: durhamModule.notes,
  }
}

function findNextDeadline(durhamPlan: AcademicYearPlan) {
  const now = new Date()
  const currentDate: string =
    now.toISOString().split('T')[0] || now.toISOString().substring(0, 10)

  for (const durhamModule of durhamPlan.modules) {
    for (const assessment of durhamModule.assessments) {
      let dueDate = ''
      if (assessment.type === 'Exam' && 'window' in assessment) {
        dueDate = assessment.window.start
      } else if ('due' in assessment) {
        dueDate = assessment.due
      }
      if (dueDate && currentDate && dueDate > currentDate) {
        return {
          id: `assessment-${
            durhamModule.code ||
            durhamModule.title.replace(/\s+/g, '-').toLowerCase()
          }`,
          module_id: durhamModule.code || durhamPlan.yearKey,
          title: `${assessment.type} - ${durhamModule.title}`,
          type: assessment.type.toLowerCase() as 'essay' | 'exam',
          due_at: `${dueDate}T23:59:59Z`,
          weight_percentage: assessment.weight || 100,
          status: 'not_started' as const,
        }
      }
    }
  }
  return undefined
}

function generateUpcomingEvents(durhamPlan: AcademicYearPlan) {
  const events: any[] = []
  const now = new Date()
  const currentWeeks = getCurrentTermWeeks(durhamPlan, now)

  durhamPlan.modules.slice(0, 3).forEach((durhamModule, moduleIndex) => {
    currentWeeks.slice(0, 2).forEach((week, weekIndex) => {
      events.push({
        id: `lecture-${durhamModule.code || moduleIndex}-${weekIndex}`,
        title: `${durhamModule.title} Lecture`,
        description: 'Weekly scheduled lecture',
        start_at: `${week}T10:00:00Z`,
        end_at: `${week}T11:00:00Z`,
        location: `Lecture Hall ${String.fromCharCode(65 + moduleIndex)}`,
        type: 'lecture' as const,
        module_id: durhamModule.code || `${durhamPlan.yearKey}-${moduleIndex}`,
        is_university_fixed: true,
        is_all_day: false,
      })
    })
  })

  return events.slice(0, 5)
}

function getCurrentTermWeeks(durhamPlan: AcademicYearPlan, now: Date): string[] {
  const currentDateStr =
    now.toISOString().split('T')[0] || now.toISOString().substring(0, 10)

  if (
    currentDateStr >= durhamPlan.termDates.michaelmas.start &&
    currentDateStr <= durhamPlan.termDates.michaelmas.end
  ) {
    return durhamPlan.termDates.michaelmas.weeks || []
  }

  if (
    currentDateStr >= durhamPlan.termDates.epiphany.start &&
    currentDateStr <= durhamPlan.termDates.epiphany.end
  ) {
    return durhamPlan.termDates.epiphany.weeks || []
  }

  return durhamPlan.termDates.michaelmas.weeks || []
}

function calculateTermProgress(yearIndex: number, term: number, currentYearIndex: number): number {
  if (yearIndex < currentYearIndex) return 100
  if (yearIndex > currentYearIndex) return 0

  const now = new Date()
  const currentMonth = now.getMonth() + 1 // 1-12

  if (term === 1) return currentMonth >= 10 && currentMonth <= 12 ? 75 : 0 // Michaelmas
  if (term === 2) return currentMonth >= 1 && currentMonth <= 3 ? 60 : currentMonth > 3 ? 100 : 0 // Epiphany
  return currentMonth >= 4 && currentMonth <= 6 ? 30 : currentMonth > 6 ? 100 : 0 // Easter
}

function calculateOverallProgress(yearIndex: number, currentYearIndex: number): number {
  if (yearIndex < currentYearIndex) return 100
  if (yearIndex > currentYearIndex) return 0

  const now = new Date()
  const m = now.getMonth() + 1
  if (m >= 10 || m <= 12) return 25
  if (m >= 1 && m <= 3) return 60
  if (m >= 4 && m <= 6) return 85
  return 15
}
