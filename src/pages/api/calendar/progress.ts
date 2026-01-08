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

    // Return empty array - progress calculation to be implemented based on
    // real user_events and user_assessments data in future phase
    const moduleProgress: ModuleProgress[] = [];

    return res.status(200).json(moduleProgress);
  } catch (error) {
    console.error('Error fetching module progress:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
