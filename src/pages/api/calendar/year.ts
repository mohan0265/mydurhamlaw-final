// src/pages/api/calendar/year.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSupabase } from '@/lib/supabase/server'
import { YearOverview } from '@/types/calendar'
import { DURHAM_LLB_2025_26, getDefaultPlanByStudentYear } from '@/data/durham/llb'

// Force this API to use Node.js runtime instead of Edge Runtime
export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { programme = 'LLB', year = '1', academicYear = '2025/26' } = req.query
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_CALENDAR === 'true'

    // --- AUTH (supports Bearer token or cookie) ---
    const authHeader = String(req.headers.authorization || '')
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : undefined

    const supabase = getServerSupabase(req, res)
    const { data: userData, error: authError } = token
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser()
    const user = userData?.user

    // DEMO MODE: unauthenticated → return a valid, typed YearOverview from dataset
    if ((!user || authError) && isDemoMode) {
      const yearOfStudy = Number(year) || 1
      const normalizedYearGroup = yearOfStudy === 0 ? 'foundation' : `year${yearOfStudy}` as 'foundation'|'year1'|'year2'|'year3'
      const plan = getDefaultPlanByStudentYear(normalizedYearGroup)
      
      const demo: YearOverview = {
        academic_year: String(academicYear || '2025/26'),
        programme: String(programme || 'LLB'),
        year_of_study: yearOfStudy,
        term_1: {
          name: 'Michaelmas Term',
          start_date: plan.termDates.michaelmas.start,
          end_date: plan.termDates.michaelmas.end,
          modules: plan.modules.filter(m => m.delivery === 'Michaelmas' || m.delivery === 'Michaelmas+Epiphany').map((m, i) => ({
            id: String(i + 1),
            code: m.code || '',
            title: m.title,
            programme: String(programme || 'LLB'),
            year: yearOfStudy,
            semester: 1,
            credits: m.credits,
          })),
          progress_percentage: 0,
        },
        term_2: {
          name: 'Epiphany Term',
          start_date: plan.termDates.epiphany.start,
          end_date: plan.termDates.epiphany.end,
          modules: plan.modules.filter(m => m.delivery === 'Epiphany' || m.delivery === 'Michaelmas+Epiphany').map((m, i) => ({
            id: String(i + 10),
            code: m.code || '',
            title: m.title,
            programme: String(programme || 'LLB'),
            year: yearOfStudy,
            semester: 2,
            credits: m.credits,
          })),
          progress_percentage: 0,
        },
        term_3: {
          name: 'Easter Term',
          start_date: plan.termDates.easter.start,
          end_date: plan.termDates.easter.end,
          modules: [],
          progress_percentage: 0,
        },
        overall_progress: 0,
        upcoming_events: [],
      }
      return res.status(200).json(demo)
    }

    // Normal auth required when not in demo mode
    if (!user || authError) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
    // --- END AUTH ---

    // Use dataset for authenticated users too
    const yearOfStudy = parseInt(year as string, 10) || 1
    const normalizedYearGroup = yearOfStudy === 0 ? 'foundation' : `year${yearOfStudy}` as 'foundation'|'year1'|'year2'|'year3'
    const plan = getDefaultPlanByStudentYear(normalizedYearGroup)
    
    // Find assessments within the next month
    const today = new Date()
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    
    const assessments = plan.modules.flatMap((module, moduleIndex) =>
      module.assessments.map((assessment, assessmentIndex) => {
        if (assessment.type === 'Exam') return null // Skip exams for next_deadline
        
        // Only handle assessments with 'due' field, not 'window'
        if (!('due' in assessment)) return null
        
        const dueDate = new Date(assessment.due)
        if (dueDate >= today && dueDate <= nextMonth) {
          return {
            id: `assessment-${moduleIndex}-${assessmentIndex}`,
            module_id: String(moduleIndex + 1),
            title: `${module.title} ${assessment.type}`,
            type: assessment.type === 'Problem Question' ? 'coursework' : 
                  assessment.type.toLowerCase() as 'essay' | 'presentation',
            due_at: assessment.due + 'T23:59:59Z',
            weight_percentage: assessment.weight || 0,
            status: 'not_started' as const,
          }
        }
        return null
      })
    ).filter((item): item is NonNullable<typeof item> => item !== null)[0] // Take first upcoming assessment

    const yearOverview: YearOverview = {
      academic_year: academicYear as string,
      programme: programme as string,
      year_of_study: yearOfStudy,
      term_1: {
        name: 'Michaelmas Term',
        start_date: plan.termDates.michaelmas.start,
        end_date: plan.termDates.michaelmas.end,
        modules: plan.modules.filter(m => m.delivery === 'Michaelmas' || m.delivery === 'Michaelmas+Epiphany').map((m, i) => ({
          id: String(i + 1),
          code: m.code || '',
          title: m.title,
          programme: programme as string,
          year: yearOfStudy,
          semester: 1,
          credits: m.credits,
        })),
        progress_percentage: 0,
      },
      term_2: {
        name: 'Epiphany Term',
        start_date: plan.termDates.epiphany.start,
        end_date: plan.termDates.epiphany.end,
        modules: plan.modules.filter(m => m.delivery === 'Epiphany' || m.delivery === 'Michaelmas+Epiphany').map((m, i) => ({
          id: String(i + 10),
          code: m.code || '',
          title: m.title,
          programme: programme as string,
          year: yearOfStudy,
          semester: 2,
          credits: m.credits,
        })),
        progress_percentage: 0,
      },
      term_3: {
        name: 'Easter Term',
        start_date: plan.termDates.easter.start,
        end_date: plan.termDates.easter.end,
        modules: [],
        progress_percentage: 0,
      },
      overall_progress: 0,
      next_deadline: assessments,
      upcoming_events: [], // No longer generating fake lecture events
    }

    return res.status(200).json(yearOverview)
  } catch (error) {
    console.error('Error fetching year overview:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
