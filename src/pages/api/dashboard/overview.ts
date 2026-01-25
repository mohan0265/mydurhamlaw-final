import type { NextApiRequest, NextApiResponse } from 'next'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

/**
 * GUARDRAIL: NEXT BEST ACTION LOGIC
 * ==============================================================================
 * This API endpoint is the SOURCE OF TRUTH for the Dashboard's "Next Best Action".
 *
 * CRITICAL RULES - DO NOT CHANGE WITHOUT PRODUCT APPROVAL:
 * 1. Data Source: Must merge REAL assignments from DB + YAAG calendar events.
 *    - DO NOT replace with LLM-generated generic advice.
 *    - REAL deadlines must always take precedence.
 *
 * 2. Priority Scoring:
 *    - Exams (300) > Assignments (200) > Coursework/Assessments (100) > Others (50)
 *    - This ensures high-stakes items appear first.
 *
 * 3. Sorting:
 *    - Primary: Due Date (soonest first)
 *    - Secondary: Priority Score (highest first)
 *
 * 4. Empty State:
 *    - If no items in 14 days, return empty list.
 *    - Front-end handles "You're on track" messaging.
 * ==============================================================================
 */
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

    // 0. Get User Profile for Year Group
    const { data: profile } = await supabase
      .from('profiles')
      .select('year_group')
      .eq('id', user.id)
      .maybeSingle();
    
    const yearKey = profile?.year_group || 'year1';

    // 1. Fetch User Preferences (Resilient)
    const preferences: UserPreferences = { show_deadline_countdown: false };
    try {
      const { data: prefData } = await supabase
        .from('user_preferences')
        .select('show_deadline_countdown')
        .eq('user_id', user.id)
        .maybeSingle();

      if (prefData) {
        preferences.show_deadline_countdown = prefData.show_deadline_countdown;
      }
    } catch (e) {
      console.warn('[dashboard/overview] user_preferences table likely missing. Defaulting to false.');
    }

    // 2. Fetch Assignments
    let assignments: any[] = [];
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('id, title, module_name, module_code, due_date, status, current_stage, estimated_effort_hours, module_id')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true })
        .limit(50);

      if (error) throw error;
      
      // JS Filter to safely handle NULL status and Case-Insensitivity
      assignments = (data || []).filter(a => {
         const s = (a.status || '').toLowerCase();
         return !['submitted', 'completed'].includes(s);
      });
    } catch (error) {
      console.error('[dashboard/overview] Error fetching assignments:', error);
    }

    // 3. Fetch YAAG Events (Next 14 days)
    const now = new Date();
    const fromDate = now.toISOString().split('T')[0] || '';
    const toDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '';

    let yaagDeadlines: any[] = [];
    try {
      const yaagEvents = await buildYAAGEvents({
        req,
        res,
        yearKey,
        fromDate,
        toDate,
        userId: user.id,
        supabase
      } as any);
      
      
      // RELAXED FILTERING: Assessments, Exams, OR high-priority topics/personal items.
      // NOTE: buildYAAGEvents already includes assignments, so we DON'T filter them out here
      yaagDeadlines = (yaagEvents || []).filter(e => {
        const isAssessment = e.kind === 'assessment' || e.kind === 'exam';
        const isHighPriorityTopic = e.kind === 'topic' && (e.meta?.priority === 'high' || e.meta?.source === 'personal');
        const isAssignment = e.meta?.source === 'assignment';
        
        return isAssessment || isHighPriorityTopic || isAssignment;
      });


      console.log(`[dashboard/overview] Found ${yaagEvents.length} total events, ${yaagDeadlines.length} high-priority/assessment filtered.`);

      // DEDUP: Remove YAAG events that shadow real assignments
      // Aggressive normalization: lowercase + remove all non-alphanumeric chars
      const normalize = (str: string) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const assignmentTitles = new Set(assignments.map(a => normalize(a.title)));
      
      yaagDeadlines = yaagDeadlines.filter(e => {
         return !assignmentTitles.has(normalize(e.title));
      });

    } catch (error) {
      console.error('[dashboard/overview] Error fetching YAAG events:', error);
    }

    // 4. Merge and Enforce Sorting
    const mergedList: any[] = [];

    // Process table-based assignments
    assignments.forEach(a => {
      const dueDate = new Date(a.due_date);
      const diffMs = dueDate.getTime() - now.getTime();
      // If due today (within 24h), daysLeft is 0. Else floor of the day difference.
      const daysLeft = diffMs > 0 ? Math.floor(diffMs / (1000 * 60 * 60 * 24)) : 0;
      const eventDay = a.due_date.split('T')[0];

      mergedList.push({
        id: a.id,
        title: a.title,
        module_name: a.module_name,
        module_code: a.module_code,
        due_date: a.due_date,
        daysLeft,
        status: a.status || 'not_started',
        current_stage: a.current_stage || 0,
        source: 'assignment',
        eventDay,
        yaagLink: `/year-at-a-glance/day?y=${yearKey}&d=${eventDay}`,
        typeLabel: 'Assignment'
      });
    });

    // Process YAAG-based deadlines (exams/assessments from plan or personal)
    yaagDeadlines.forEach(e => {
      const isoString = e.start_at || `${e.date}T23:59:59Z`;
      const dueDate = new Date(isoString);
      const diffMs = dueDate.getTime() - now.getTime();
      const daysLeft = diffMs > 0 ? Math.floor(diffMs / (1000 * 60 * 60 * 24)) : 0;

      mergedList.push({
        id: e.id,
        title: e.title,
        module_name: e.moduleCode || null,
        module_code: e.moduleCode || null,
        due_date: isoString,
        daysLeft,
        status: e.meta?.status || 'upcoming',
        current_stage: 0,
        source: 'yaag',
        eventDay: e.date,
        yaagLink: `/year-at-a-glance/day?y=${yearKey}&d=${e.date}`,
        typeLabel: e.kind === 'exam' ? 'Exam' : 'Assessment'
      });
    });

    // Priority scoring helper
    function getPriorityScore(item: any): number {
      // Exam = highest priority
      if (item.kind === 'exam' || item.typeLabel === 'Exam') return 300;
      
      // Assignment from DB
      if (item.source === 'assignment') return 200;
      
      // YAAG assessment/coursework
      if (item.kind === 'assessment') return 100;
      
      return 0;
    }

    // Final Sort: Soonest first, then by priority type
    mergedList.sort((a, b) => {
      const timeA = new Date(a.due_date).getTime();
      const timeB = new Date(b.due_date).getTime();
      if (timeA !== timeB) return timeA - timeB;
      
      // Sort by priority type (Exams > Assignments > Coursework)
      return getPriorityScore(b) - getPriorityScore(a);
    });

    // Post-process to add Reasoning Codes for "Why this?" explanation
    const enrichedList = mergedList.map(item => {
      const codes: string[] = [];
      const score = getPriorityScore(item);
      
      if (item.daysLeft <= 3) codes.push('DEADLINE_SOON');
      else if (item.daysLeft <= 14) codes.push('WITHIN_14_DAYS');
      
      if (score === 300) codes.push('HIGH_PRIORITY_EXAM');
      if (score === 200) codes.push('ASSIGNMENT_WORK');
      
      return {
        ...item,
        priorityScore: score,
        reasonCodes: codes
      };
    });

    return res.status(200).json({ 
      upcomingAssignments: enrichedList.slice(0, 10),
      preferences,
      yearKey
    } as any);

  } catch (err: any) {
    console.error('[dashboard/overview] Unexpected error:', err)
    return res.status(500).json({ upcomingAssignments: [], preferences: { show_deadline_countdown: false }, error: err.message || 'Internal error' })
  }
}
