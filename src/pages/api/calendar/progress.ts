// src/pages/api/calendar/progress.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSupabase, getServerUser } from '@/lib/api/serverAuth'
import { ModuleProgress } from '@/types/calendar'

// Force this API to use Node.js runtime instead of Edge Runtime
export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Not used yet, but kept for future filtering
    const { programme = 'LLB', year = '1' } = req.query
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_CALENDAR === 'true'

    // --- AUTH (supports Authorization: Bearer <token>) ---
    const { user, error: authError } = await getServerUser(req, res)

    // Demo mode: unauthenticated -> return typed empty list
    if ((!user || authError) && isDemoMode) {
      const empty: ModuleProgress[] = []
      return res.status(200).json(empty)
    }

    if (!user || authError) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
    // --- END AUTH ---

    // Mock progress data - replace with actual Supabase queries when ready
    const moduleProgress: ModuleProgress[] = [
      {
        module_id: '1',
        module_code: 'LAW1001',
        module_title: 'Introduction to English Legal System',
        completed_topics: 8,
        total_topics: 12,
        percentage: 67,
        upcoming_deadlines: [
          {
            id: 'exam-1',
            module_id: '1',
            title: 'Mid-term Examination',
            date: '2025-12-10',
            location: 'Examination Hall A',
            exam_type: 'written',
          },
        ],
        recent_activity: [
          { date: '2025-11-15', activity: 'Completed Topic: Court System Structure', type: 'topic_completed' },
          { date: '2025-11-12', activity: 'Completed Topic: Sources of Law', type: 'topic_completed' },
        ],
      },
      {
        module_id: '2',
        module_code: 'LAW1002',
        module_title: 'Constitutional Law',
        completed_topics: 6,
        total_topics: 15,
        percentage: 40,
        upcoming_deadlines: [
          {
            id: 'assessment-2',
            module_id: '2',
            title: 'Constitutional Law Essay',
            type: 'essay',
            due_at: '2025-12-15T23:59:59Z',
            weight_percentage: 40,
            status: 'not_started',
          },
        ],
        recent_activity: [
          { date: '2025-11-14', activity: 'Completed Topic: Parliamentary Sovereignty', type: 'topic_completed' },
          { date: '2025-11-10', activity: 'Completed Topic: Separation of Powers', type: 'topic_completed' },
        ],
      },
      {
        module_id: '3',
        module_code: 'LAW1003',
        module_title: 'Contract Law',
        completed_topics: 10,
        total_topics: 14,
        percentage: 71,
        upcoming_deadlines: [
          {
            id: 'assessment-3',
            module_id: '3',
            title: 'Contract Law Essay',
            type: 'essay', // keep types narrow to match calendar typings
            due_at: '2025-12-20T23:59:59Z',
            weight_percentage: 30,
            status: 'in_progress',
          },
        ],
        recent_activity: [
          { date: '2025-11-16', activity: 'Completed Topic: Breach of Contract', type: 'topic_completed' },
          { date: '2025-11-13', activity: 'Completed Topic: Contract Formation', type: 'topic_completed' },
        ],
      },
      {
        module_id: '4',
        module_code: 'LAW1004',
        module_title: 'Tort Law',
        completed_topics: 2,
        total_topics: 16,
        percentage: 13,
        upcoming_deadlines: [],
        recent_activity: [{ date: '2025-11-08', activity: 'Completed Topic: Introduction to Tort', type: 'topic_completed' }],
      },
      {
        module_id: '5',
        module_code: 'LAW1005',
        module_title: 'Criminal Law',
        completed_topics: 1,
        total_topics: 18,
        percentage: 6,
        upcoming_deadlines: [],
        recent_activity: [{ date: '2025-11-05', activity: 'Completed Topic: Elements of Crime', type: 'topic_completed' }],
      },
      {
        module_id: '6',
        module_code: 'LAW1006',
        module_title: 'Public Law',
        completed_topics: 0,
        total_topics: 12,
        percentage: 0,
        upcoming_deadlines: [],
        recent_activity: [],
      },
      {
        module_id: '7',
        module_code: 'LAW1007',
        module_title: 'Property Law',
        completed_topics: 0,
        total_topics: 14,
        percentage: 0,
        upcoming_deadlines: [],
        recent_activity: [],
      },
      {
        module_id: '8',
        module_code: 'LAW1008',
        module_title: 'Equity and Trusts',
        completed_topics: 0,
        total_topics: 13,
        percentage: 0,
        upcoming_deadlines: [],
        recent_activity: [],
      },
    ]

    return res.status(200).json(moduleProgress)
  } catch (error) {
    console.error('Error fetching module progress:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
