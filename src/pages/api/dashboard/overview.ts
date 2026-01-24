import type { NextApiRequest, NextApiResponse } from 'next'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import { buildYAAGEvents } from '@/lib/calendar/yaagEventsBuilder'

/**
 * Dashboard Overview API
 * Returns upcoming assignments and assessments (Assignments + YAAG)
 * sorted by urgency with calculated days left
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
  source: 'assignment' | 'yaag';
}

type UserPreferences = {
  show_deadline_countdown: boolean;
}

type OverviewResponse = {
  upcomingAssignments: AssignmentSummary[];
  preferences: UserPreferences;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OverviewResponse>
) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ upcomingAssignments: [], preferences: { show_deadline_countdown: false }, error: 'Method not allowed' })
  }

  try {
    // Verify user session using Supabase auth helper
    const supabase = createPagesServerClient({ req, res })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return res.status(401).json({ upcomingAssignments: [], preferences: { show_deadline_countdown: false }, error: 'Unauthorized' })
    }

    // 1. Fetch User Preferences
    const { data: prefData } = await supabase
      .from('user_preferences')
      .select('show_deadline_countdown')
      .eq('user_id', user.id)
      .maybeSingle();

    const preferences: UserPreferences = {
      show_deadline_countdown: prefData?.show_deadline_countdown ?? false
    };

    // 2. Fetch Assignments
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select('id, title, module_name, module_code, due_date, status, current_stage, estimated_effort_hours, module_id')
      .eq('user_id', user.id)
      .not('status', 'in', '(submitted,completed)')
      .order('due_date', { ascending: true })
      .limit(20);

    if (error) {
      console.error('[dashboard/overview] Error fetching assignments:', error);
    }

    // 3. Fetch YAAG Assessments (Next 14 days)
    const now = new Date();
    const fromDate = now.toISOString().split('T')[0] || '';
    const toDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '';

    const yaagEvents = await buildYAAGEvents({
      req,
      res,
      fromDate,
      toDate,
      userId: user.id
    });

    // Filter only assessments/deadlines from YAAG
    const yaagDeadlines = yaagEvents.filter(e => e.kind === 'assessment' && e.meta?.source !== 'assignment');

    // 4. Merge and Enforce Sorting
    const mergedList: AssignmentSummary[] = [];

    // Add Assignments
    (assignments || []).forEach(a => {
      const dueDate = new Date(a.due_date);
      const diffMs = dueDate.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      mergedList.push({
        id: a.id,
        title: a.title,
        module_name: a.module_name,
        module_code: a.module_code,
        due_date: a.due_date,
        daysLeft,
        status: a.status || 'not_started',
        current_stage: a.current_stage || 0,
        estimated_effort_hours: a.estimated_effort_hours,
        nextAction: (a.current_stage || 0) === 0 ? 'start' : 'continue',
        source: 'assignment'
      });
    });

    // Add YAAG Deadlines
    yaagDeadlines.forEach(e => {
      const dueDate = new Date(e.date + 'T23:59:59Z'); // All-day deadlines end of day
      const diffMs = dueDate.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      mergedList.push({
        id: e.id,
        title: e.title,
        module_name: e.moduleCode || null,
        module_code: e.moduleCode || null,
        due_date: e.date,
        daysLeft,
        status: e.meta?.status || 'upcoming',
        current_stage: 0,
        estimated_effort_hours: null,
        nextAction: 'start',
        source: 'yaag'
      });
    });

    // Final Sort: Soonest first, then priority to assignments
    mergedList.sort((a, b) => {
      const timeA = new Date(a.due_date).getTime();
      const timeB = new Date(b.due_date).getTime();
      if (timeA !== timeB) return timeA - timeB;
      if (a.source !== b.source) return a.source === 'assignment' ? -1 : 1;
      return 0;
    });

    return res.status(200).json({ 
      upcomingAssignments: mergedList.slice(0, 10),
      preferences 
    });

  } catch (err: any) {
    console.error('[dashboard/overview] Unexpected error:', err)
    return res.status(500).json({ upcomingAssignments: [], preferences: { show_deadline_countdown: false }, error: err.message || 'Internal error' })
  }
}
