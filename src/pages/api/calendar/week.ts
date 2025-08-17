import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSupabase } from '@/lib/supabase/server'
import { CalendarEvent, PersonalItem } from '@/types/calendar'
import { format, addDays, isSameWeek, startOfWeek } from 'date-fns'

// Local helpers to replace fragile date-fns imports
const daysInInterval = (start: Date, end: Date): Date[] => {
  const out: Date[] = [];
  const d = new Date(start); d.setHours(0,0,0,0);
  const last = new Date(end); last.setHours(0,0,0,0);
  while (d.getTime() <= last.getTime()) { out.push(new Date(d)); d.setDate(d.getDate() + 1); }
  return out;
};
const parseIso = (s: string) => new Date(s);

// Force this API to use Node.js runtime instead of Edge Runtime
export const config = {
  runtime: 'nodejs'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { from, to } = req.query

    if (!from || !to) {
      return res.status(400).json({ message: 'Missing from or to date parameters' })
    }

    // Get user from session
    const supabase = getServerSupabase(req, res)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const fromDate = parseIso(from as string)
    const toDate = parseIso(to as string)

    // Mock university fixed events
    const mockEvents: CalendarEvent[] = []
    const weekStart = startOfWeek(fromDate, { weekStartsOn: 1 })
    
    // Generate some weekly recurring lectures
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i)
      const dateStr = format(day, 'yyyy-MM-dd')
      
      // Monday, Wednesday, Friday - Contract Law
      if ([1, 3, 5].includes(day.getDay())) {
        mockEvents.push({
          id: `lecture-contract-${dateStr}`,
          title: 'Contract Law Lecture',
          description: 'Formation and Terms of Contracts',
          start_at: `${dateStr}T10:00:00Z`,
          end_at: `${dateStr}T11:00:00Z`,
          location: 'Lecture Hall A',
          type: 'lecture',
          module_id: '3',
          is_university_fixed: true,
          is_all_day: false
        })
      }

      // Tuesday, Thursday - Constitutional Law
      if ([2, 4].includes(day.getDay())) {
        mockEvents.push({
          id: `lecture-constitutional-${dateStr}`,
          title: 'Constitutional Law Lecture',
          description: 'Parliamentary Sovereignty and Rule of Law',
          start_at: `${dateStr}T14:00:00Z`,
          end_at: `${dateStr}T15:30:00Z`,
          location: 'Lecture Hall B',
          type: 'lecture',
          module_id: '2',
          is_university_fixed: true,
          is_all_day: false
        })
      }

      // Wednesday - Tutorial
      if (day.getDay() === 3) {
        mockEvents.push({
          id: `tutorial-${dateStr}`,
          title: 'Legal Research Tutorial',
          description: 'Small group tutorial on legal research methods',
          start_at: `${dateStr}T16:00:00Z`,
          end_at: `${dateStr}T17:00:00Z`,
          location: 'Tutorial Room 5',
          type: 'tutorial',
          module_id: '1',
          is_university_fixed: true,
          is_all_day: false
        })
      }

      // Friday - Seminar
      if (day.getDay() === 5) {
        mockEvents.push({
          id: `seminar-${dateStr}`,
          title: 'Legal Ethics Seminar',
          description: 'Discussion on professional conduct and ethics',
          start_at: `${dateStr}T13:00:00Z`,
          end_at: `${dateStr}T14:30:00Z`,
          location: 'Seminar Room 2',
          type: 'seminar',
          module_id: '1',
          is_university_fixed: true,
          is_all_day: false
        })
      }
    }

    // Mock personal study items
    const mockPersonalItems: PersonalItem[] = [
      {
        id: 'study-1',
        user_id: user.id,
        title: 'Contract Law Reading',
        type: 'study',
        start_at: `${format(addDays(weekStart, 0), 'yyyy-MM-dd')}T19:00:00Z`,
        end_at: `${format(addDays(weekStart, 0), 'yyyy-MM-dd')}T21:00:00Z`,
        notes: 'Chapter 3: Consideration',
        is_all_day: false,
        module_id: '3',
        priority: 'medium',
        completed: false
      },
      {
        id: 'study-2',
        user_id: user.id,
        title: 'Constitutional Law Revision',
        type: 'study',
        start_at: `${format(addDays(weekStart, 1), 'yyyy-MM-dd')}T20:00:00Z`,
        end_at: `${format(addDays(weekStart, 1), 'yyyy-MM-dd')}T22:00:00Z`,
        notes: 'Review lecture notes and prepare for seminar',
        is_all_day: false,
        module_id: '2',
        priority: 'high',
        completed: false
      },
      {
        id: 'task-1',
        user_id: user.id,
        title: 'Essay Outline',
        type: 'task',
        start_at: `${format(addDays(weekStart, 2), 'yyyy-MM-dd')}T18:00:00Z`,
        end_at: `${format(addDays(weekStart, 2), 'yyyy-MM-dd')}T19:30:00Z`,
        notes: 'Create detailed outline for constitutional law essay',
        is_all_day: false,
        module_id: '2',
        priority: 'high',
        completed: false
      },
      {
        id: 'study-3',
        user_id: user.id,
        title: 'Legal Research Practice',
        type: 'study',
        start_at: `${format(addDays(weekStart, 3), 'yyyy-MM-dd')}T15:00:00Z`,
        end_at: `${format(addDays(weekStart, 3), 'yyyy-MM-dd')}T17:00:00Z`,
        notes: 'Practice using legal databases and citation',
        is_all_day: false,
        module_id: '1',
        priority: 'medium',
        completed: false
      },
      {
        id: 'study-4',
        user_id: user.id,
        title: 'Weekend Review Session',
        type: 'study',
        start_at: `${format(addDays(weekStart, 5), 'yyyy-MM-dd')}T10:00:00Z`,
        end_at: `${format(addDays(weekStart, 5), 'yyyy-MM-dd')}T13:00:00Z`,
        notes: 'Weekly review of all modules',
        is_all_day: false,
        module_id: '',
        priority: 'low',
        completed: false
      }
    ]

    const weekData = {
      events: mockEvents,
      personal_items: mockPersonalItems
    }

    res.status(200).json(weekData)
  } catch (error) {
    console.error('Error fetching week data:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}