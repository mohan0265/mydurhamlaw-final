import type { NextApiRequest, NextApiResponse } from 'next'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

/**
 * Dashboard Overview API
 * Returns upcoming assignments sorted by urgency with calculated days left
 * 
 * GET /api/dashboard/overview
 */

type AssignmentSummary = {
  id: string;
  title: string;
  module_name: string | null;
  module_code: string | null;
  due_date: string;
  daysLeft: number;
  status: string;
  current_stage: number;
  estimated_effort_hours: number | null;
  nextAction: 'start' | 'continue';
}

type OverviewResponse = {
  upcomingAssignments: AssignmentSummary[];
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OverviewResponse>
) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ upcomingAssignments: [], error: 'Method not allowed' })
  }

  try {
    // Verify user session using Supabase auth helper
    const supabase = createPagesServerClient({ req, res })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return res.status(401).json({ upcomingAssignments: [], error: 'Unauthorized' })
    }

    // Fetch upcoming assignments (not submitted/completed)
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select('id, title, module_name, module_code, due_date, status, current_stage, estimated_effort_hours')
      .eq('user_id', user.id)
      .not('status', 'in', '(submitted,completed)')
      .order('due_date', { ascending: true })
      .limit(10) // Get top 10

    if (error) {
      console.error('[dashboard/overview] Error fetching assignments:', error)
      return res.status(500).json({ upcomingAssignments: [], error: 'Failed to fetch assignments' })
    }

    // Calculate daysLeft and nextAction for each assignment
    const now = new Date()
    const upcomingAssignments: AssignmentSummary[] = (assignments || []).map((a) => {
      const dueDate = new Date(a.due_date)
      const diffMs = dueDate.getTime() - now.getTime()
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

      return {
        id: a.id,
        title: a.title,
        module_name: a.module_name,
        module_code: a.module_code,
        due_date: a.due_date,
        daysLeft,
        status: a.status || 'not_started',
        current_stage: a.current_stage || 0,
        estimated_effort_hours: a.estimated_effort_hours,
        nextAction: (a.current_stage || 0) === 0 ? 'start' : 'continue'
      }
    })

    return res.status(200).json({ upcomingAssignments })

  } catch (err: any) {
    console.error('[dashboard/overview] Unexpected error:', err)
    return res.status(500).json({ upcomingAssignments: [], error: err.message || 'Internal error' })
  }
}
