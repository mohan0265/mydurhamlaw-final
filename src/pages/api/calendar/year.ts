import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSupabase } from '@/lib/supabase/server'
import { YearOverview } from '@/types/calendar'

// Force this API to use Node.js runtime instead of Edge Runtime
export const config = {
  runtime: 'nodejs'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { programme = 'LLB', year = '1', academicYear = '2025/26' } = req.query

    // Get user from session
    const supabase = getServerSupabase(req, res)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    // Mock data for now - replace with actual Supabase queries
    const yearOverview: YearOverview = {
      academic_year: academicYear as string,
      programme: programme as string,
      year_of_study: parseInt(year as string),
      term_1: {
        name: 'Michaelmas Term',
        start_date: '2025-10-07',
        end_date: '2025-12-06',
        modules: [
          {
            id: '1',
            code: 'LAW1001',
            title: 'Introduction to English Legal System',
            programme: programme as string,
            year: parseInt(year as string),
            semester: 1,
            credits: 20
          },
          {
            id: '2',
            code: 'LAW1002',
            title: 'Constitutional Law',
            programme: programme as string,
            year: parseInt(year as string),
            semester: 1,
            credits: 20
          },
          {
            id: '3',
            code: 'LAW1003',
            title: 'Contract Law',
            programme: programme as string,
            year: parseInt(year as string),
            semester: 1,
            credits: 20
          }
        ],
        progress_percentage: 65
      },
      term_2: {
        name: 'Hilary Term',
        start_date: '2026-01-13',
        end_date: '2026-03-14',
        modules: [
          {
            id: '4',
            code: 'LAW1004',
            title: 'Tort Law',
            programme: programme as string,
            year: parseInt(year as string),
            semester: 2,
            credits: 20
          },
          {
            id: '5',
            code: 'LAW1005',
            title: 'Criminal Law',
            programme: programme as string,
            year: parseInt(year as string),
            semester: 2,
            credits: 20
          },
          {
            id: '6',
            code: 'LAW1006',
            title: 'Public Law',
            programme: programme as string,
            year: parseInt(year as string),
            semester: 2,
            credits: 20
          }
        ],
        progress_percentage: 25
      },
      term_3: {
        name: 'Easter Term',
        start_date: '2026-04-26',
        end_date: '2026-06-17',
        modules: [
          {
            id: '7',
            code: 'LAW1007',
            title: 'Property Law',
            programme: programme as string,
            year: parseInt(year as string),
            semester: 3,
            credits: 20
          },
          {
            id: '8',
            code: 'LAW1008',
            title: 'Equity and Trusts',
            programme: programme as string,
            year: parseInt(year as string),
            semester: 3,
            credits: 20
          }
        ],
        progress_percentage: 0
      },
      overall_progress: 30,
      next_deadline: {
        id: 'assessment-1',
        module_id: '1',
        title: 'Constitutional Law Essay',
        type: 'essay',
        due_at: '2025-12-15T23:59:59Z',
        weight_percentage: 40,
        status: 'not_started'
      },
      upcoming_events: [
        {
          id: 'event-1',
          title: 'Contract Law Lecture',
          description: 'Formation of Contracts',
          start_at: '2025-11-20T10:00:00Z',
          end_at: '2025-11-20T11:00:00Z',
          location: 'Lecture Hall A',
          type: 'lecture',
          module_id: '3',
          is_university_fixed: true,
          is_all_day: false
        },
        {
          id: 'event-2',
          title: 'Constitutional Law Seminar',
          description: 'Parliamentary Sovereignty',
          start_at: '2025-11-21T14:00:00Z',
          end_at: '2025-11-21T15:30:00Z',
          location: 'Seminar Room 3',
          type: 'seminar',
          module_id: '2',
          is_university_fixed: true,
          is_all_day: false
        },
        {
          id: 'event-3',
          title: 'Mock Exam - Introduction to Legal System',
          description: 'Practice examination',
          start_at: '2025-11-25T09:00:00Z',
          end_at: '2025-11-25T11:00:00Z',
          location: 'Examination Hall',
          type: 'exam',
          module_id: '1',
          is_university_fixed: true,
          is_all_day: false
        }
      ]
    }

    res.status(200).json(yearOverview)
  } catch (error) {
    console.error('Error fetching year overview:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}