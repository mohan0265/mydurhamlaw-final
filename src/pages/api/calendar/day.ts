import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSupabase } from '@/lib/supabase/server'
import { DayDetail } from '@/types/calendar'
import { format } from 'date-fns'

// Force this API to use Node.js runtime instead of Edge Runtime
export const config = {
  runtime: 'nodejs'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { date } = req.query

    if (!date) {
      return res.status(400).json({ message: 'Missing date parameter' })
    }

    // Get user from session
    const supabase = getServerSupabase(req, res)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const selectedDate = new Date(date as string)
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    const dayName = format(selectedDate, 'EEEE')
    const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr

    // Mock day detail data
    const mockDayDetail: DayDetail = {
      date: dateStr,
      day_name: dayName,
      is_today: isToday,
      events: [
        {
          id: `lecture-${dateStr}`,
          title: 'Contract Law Lecture',
          description: 'Formation of Contracts - Offer and Acceptance',
          start_at: `${dateStr}T10:00:00Z`,
          end_at: `${dateStr}T11:00:00Z`,
          location: 'Lecture Hall A',
          type: 'lecture',
          module_id: '3',
          is_university_fixed: true,
          is_all_day: false
        },
        {
          id: `seminar-${dateStr}`,
          title: 'Constitutional Law Seminar',
          description: 'Discussion on Parliamentary Sovereignty',
          start_at: `${dateStr}T14:00:00Z`,
          end_at: `${dateStr}T15:30:00Z`,
          location: 'Seminar Room 3',
          type: 'seminar',
          module_id: '2',
          is_university_fixed: true,
          is_all_day: false
        }
      ],
      assessments_due: isToday ? [
        {
          id: 'assessment-due',
          module_id: '2',
          title: 'Constitutional Law Essay',
          type: 'essay',
          due_at: `${dateStr}T23:59:59Z`,
          weight_percentage: 40,
          description: 'Analyse the concept of parliamentary sovereignty in the UK constitution',
          status: 'not_started'
        }
      ] : [],
      exams: [],
      personal_items: [
        {
          id: 'personal-1',
          user_id: user.id,
          title: 'Study Session - Contract Law',
          type: 'study',
          start_at: `${dateStr}T19:00:00Z`,
          end_at: `${dateStr}T21:00:00Z`,
          notes: 'Review lecture notes and read textbook chapters 3-4',
          is_all_day: false,
          module_id: '3',
          priority: 'medium',
          completed: false
        },
        {
          id: 'personal-2',
          user_id: user.id,
          title: 'Library Research',
          type: 'task',
          start_at: `${dateStr}T16:00:00Z`,
          end_at: `${dateStr}T18:00:00Z`,
          notes: 'Find additional sources for constitutional law essay',
          is_all_day: false,
          module_id: '2',
          priority: 'high',
          completed: false
        }
      ],
      study_time_blocks: [
        {
          start_time: '09:00',
          end_time: '10:00',
          title: 'Morning Reading',
          module_id: '1'
        },
        {
          start_time: '19:00',
          end_time: '21:00',
          title: 'Evening Study Session',
          module_id: '3'
        }
      ]
    }

    res.status(200).json(mockDayDetail)
  } catch (error) {
    console.error('Error fetching day detail:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}