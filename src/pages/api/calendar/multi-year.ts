import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSupabase } from '@/lib/supabase/server'
import { MultiYearData, YearOverview, Module } from '@/types/calendar'
import { DURHAM_LLB_2025_26, getDefaultPlanByStudentYear, getPrevYearKey, getNextYearKey, AcademicYearPlan } from '@/data/durham/llb'

const yearKeyToNumber = (y: unknown): number => {
  if (typeof y === 'number') return y;
  if (typeof y === 'string') {
    const s = y.trim().toLowerCase();
    if (s.includes('foundation')) return 0;
    const m = s.match(/\d+/);
    if (m) return Number(m[0]);
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};
// Force this API to use Node.js runtime instead of Edge Runtime
export const config = {
  runtime: 'nodejs'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { programme = 'LLB', academicYear = '2025/26' } = req.query

    // --- DEMO MODE GUARD ---
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_CALENDAR === 'true'
    const supabase = getServerSupabase(req, res)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if ((authError || !user) && isDemoMode) {
      // Return typed empty payload for demo mode if unauthenticated
      return res.status(200).json({
        "years": { "foundation": null, "year1": null, "year2": null, "year3": null },
        "year_labels": ["Foundation","Year 1","Year 2","Year 3"],
        "current_year_index": 1
      })
    }
    // --- END DEMO MODE GUARD ---

    // Get user from session
    if (authError || !user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    // Get user profile to determine current year of study
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type, year_group')
      .eq('id', user.id)
      .single()

    // Determine current year index based on user profile
    const currentYearMapping: { [key: string]: number } = {
      'foundation': 0,
      'year1': 1,
      'year2': 2,
      'year3': 3
    }

    const userType = profile?.user_type || profile?.year_group || 'year1'
    const normalizedUserType = userType.toLowerCase().replace(/\s/g, '')
    const currentYearIndex = currentYearMapping[normalizedUserType] || 1

    // Convert Durham LLB data to YearOverview format
    const createYearDataFromDurham = (durhamPlan: AcademicYearPlan, yearIndex: number): YearOverview => {
      const isCurrentOrPast = yearIndex <= currentYearIndex
      const isCurrent = yearIndex === currentYearIndex
      
      // Convert modules by term
      const michaelmasModules = durhamPlan.modules
        .filter(m => m.delivery === 'Michaelmas' || m.delivery === 'Michaelmas+Epiphany')
        .map(m => convertDurhamModule(m, durhamPlan.yearKey, 1))
      
      const epiphanyModules = durhamPlan.modules
        .filter(m => m.delivery === 'Epiphany' || m.delivery === 'Michaelmas+Epiphany')
        .map(m => convertDurhamModule(m, durhamPlan.yearKey, 2))
      
      // Find next assessment deadline for current year
      const nextDeadline = isCurrent ? findNextDeadline(durhamPlan) : undefined
      
      // Generate upcoming events for current year
      const upcomingEvents = isCurrent ? generateUpcomingEvents(durhamPlan) : []

      return {
        academic_year: '2025/26',
        programme: programme as string,
        year_of_study: yearIndex,
        term_1: {
          name: 'Michaelmas Term',
          start_date: durhamPlan.termDates.michaelmas.start,
          end_date: durhamPlan.termDates.michaelmas.end,
          modules: michaelmasModules,
          progress_percentage: isCurrentOrPast ? calculateTermProgress(yearIndex, 1, currentYearIndex) : 0
        },
        term_2: {
          name: 'Epiphany Term',
          start_date: durhamPlan.termDates.epiphany.start,
          end_date: durhamPlan.termDates.epiphany.end,
          modules: epiphanyModules,
          progress_percentage: isCurrentOrPast ? calculateTermProgress(yearIndex, 2, currentYearIndex) : 0
        },
        term_3: {
          name: 'Easter Term',
          start_date: durhamPlan.termDates.easter.start,
          end_date: durhamPlan.termDates.easter.end,
          modules: [], // Easter is typically revision/exams only
          progress_percentage: isCurrentOrPast ? calculateTermProgress(yearIndex, 3, currentYearIndex) : 0
        },
        overall_progress: isCurrentOrPast ? calculateOverallProgress(yearIndex, currentYearIndex) : 0,
        next_deadline: nextDeadline,
        upcoming_events: upcomingEvents
      }
    }

    const multiYearData: MultiYearData = {
      current_year_index: currentYearIndex,
      year_labels: ['Foundation', 'Year 1', 'Year 2', 'Year 3'],
      programme: programme as string,
      academic_year: academicYear as string,
      years: {
        'foundation': createYearDataFromDurham(DURHAM_LLB_2025_26.foundation, 0),
        'year1': createYearDataFromDurham(DURHAM_LLB_2025_26.year1, 1),
        'year2': createYearDataFromDurham(DURHAM_LLB_2025_26.year2, 2),
        'year3': createYearDataFromDurham(DURHAM_LLB_2025_26.year3, 3)
      }
    }

    res.status(200).json(multiYearData)
  } catch (error) {
    console.error('Error fetching multi-year overview:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// Helper functions to work with Durham LLB data
function convertDurhamModule(durhamModule: any, yearKey: string, semester: number): Module {
  return {
    id: durhamModule.code || `${yearKey}-${durhamModule.title.replace(/\s+/g, '-').toLowerCase()}`,
    code: durhamModule.code || `${yearKey.toUpperCase()}${semester}${durhamModule.title.substring(0, 3).toUpperCase()}`,
    title: durhamModule.title,
    credits: durhamModule.credits,
    programme: 'LLB',
    year: yearKeyToNumber(yearKey),
    semester: semester as 1 | 2 | 3,
    description: durhamModule.notes
  }
}

function findNextDeadline(durhamPlan: AcademicYearPlan) {
  const now = new Date()
  const currentDate: string = now.toISOString().split('T')[0] || now.toISOString().substring(0, 10)
  
  // Find the earliest upcoming assessment
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
          id: `assessment-${durhamModule.code || durhamModule.title.replace(/\s+/g, '-').toLowerCase()}`,
          module_id: durhamModule.code || durhamPlan.yearKey,
          title: `${assessment.type} - ${durhamModule.title}`,
          type: assessment.type.toLowerCase() as 'essay' | 'exam',
          due_at: `${dueDate}T23:59:59Z`,
          weight_percentage: assessment.weight || 100,
          status: 'not_started' as const
        }
      }
    }
  }
  
  return undefined
}

function generateUpcomingEvents(durhamPlan: AcademicYearPlan) {
  const events: any[] = []
  const now = new Date()
  
  // Generate weekly lectures for each module in current term
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
        is_all_day: false
      })
    })
  })
  
  return events.slice(0, 5) // Limit to 5 events
}

function getCurrentTermWeeks(durhamPlan: AcademicYearPlan, now: Date): string[] {
  const currentDateStr = now.toISOString().split('T')[0] || now.toISOString().substring(0, 10)
  
  // Check if we're in Michaelmas term
  if (currentDateStr && currentDateStr >= durhamPlan.termDates.michaelmas.start && 
      currentDateStr <= durhamPlan.termDates.michaelmas.end) {
    return durhamPlan.termDates.michaelmas.weeks || []
  }
  
  // Check if we're in Epiphany term
  if (currentDateStr && currentDateStr >= durhamPlan.termDates.epiphany.start && 
      currentDateStr <= durhamPlan.termDates.epiphany.end) {
    return durhamPlan.termDates.epiphany.weeks || []
  }
  
  // Default to Michaelmas weeks for demo
  return durhamPlan.termDates.michaelmas.weeks || []
}

function calculateTermProgress(yearIndex: number, term: number, currentYearIndex: number): number {
  if (yearIndex < currentYearIndex) return 100 // Completed years
  if (yearIndex > currentYearIndex) return 0   // Future years
  
  // Current year progress based on term and current date
  const now = new Date()
  const currentMonth = now.getMonth() + 1 // 1-12
  
  if (term === 1) { // Michaelmas (Oct-Dec)
    return currentMonth >= 10 && currentMonth <= 12 ? 75 : 0
  } else if (term === 2) { // Epiphany (Jan-Mar)  
    return currentMonth >= 1 && currentMonth <= 3 ? 60 : currentMonth > 3 ? 100 : 0
  } else { // Easter (Apr-Jun)
    return currentMonth >= 4 && currentMonth <= 6 ? 30 : currentMonth > 6 ? 100 : 0
  }
}

function calculateOverallProgress(yearIndex: number, currentYearIndex: number): number {
  if (yearIndex < currentYearIndex) return 100
  if (yearIndex > currentYearIndex) return 0
  
  // Calculate based on current term progress
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  
  if (currentMonth >= 10 || currentMonth <= 12) return 25 // Michaelmas
  if (currentMonth >= 1 && currentMonth <= 3) return 60   // Epiphany
  if (currentMonth >= 4 && currentMonth <= 6) return 85   // Easter
  return 15 // Summer break
}