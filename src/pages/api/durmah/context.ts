import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { differenceInDays } from 'date-fns';
import type { StudentContext } from '@/types/durmahContext';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StudentContext | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const admin = getSupabaseAdmin();

    // Verify user
    const { data: { user }, error: authError } = await admin.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const userId = user.id;
    const now = new Date();

    // Fetch student profile
    const { data: profile } = await admin
      .from('profiles')
      .select('display_name, year_group')
      .eq('id', userId)
      .single();

    // PHASE 1: Fetch assignments
    // Canonical deadline: COALESCE(due_at, due_date)
    
    // 1) Upcoming (next 7 days, not completed)
    const { data: upcomingRaw } = await admin
      .from('assignments')
      .select('id, title, module, due_at, due_date')
      .eq('user_id', userId)
      .neq('status', 'completed')
      .not('due_at', 'is', null)
      .gte('due_at', now.toISOString())
      .lte('due_at', new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('due_at', { ascending: true })
      .limit(5);

    // 2) Overdue (past due, not completed)
    const { data: overdueRaw } = await admin
      .from('assignments')
      .select('id, title, module, due_at, due_date')
      .eq('user_id', userId)
      .neq('status', 'completed')
      .not('due_at', 'is', null)
      .lt('due_at', now.toISOString())
      .order('due_at', { ascending: false })
      .limit(3);

    // 3) Recently created (last 48 hours)
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const { data: recentRaw } = await admin
      .from('assignments')
      .select('id, title, module, created_at')
      .eq('user_id', userId)
      .gte('created_at', twoDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    // Get total count
    const { count: totalCount } = await admin
      .from('assignments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Transform data
    const upcoming = (upcomingRaw || []).map((a) => ({
      id: a.id,
      title: a.title,
      module: a.module || 'N/A',
      dueISO: a.due_at || a.due_date,
      daysLeft: differenceInDays(new Date(a.due_at || a.due_date), now),
    }));

    const overdue = (overdueRaw || []).map((a) => ({
      id: a.id,
      title: a.title,
      module: a.module || 'N/A',
      dueISO: a.due_at || a.due_date,
      daysOver: Math.abs(differenceInDays(new Date(a.due_at || a.due_date), now)),
    }));

    const recentlyCreated = (recentRaw || []).map((a) => ({
      id: a.id,
      title: a.title,
      module: a.module || 'N/A',
      createdISO: a.created_at,
    }));

    // TODO: Fetch timetable (for now, empty)
    const todaysClasses: any[] = [];

    // Build context
    const context: StudentContext = {
      student: {
        displayName: profile?.display_name || 'Student',
        yearGroup: profile?.year_group || 'Year 1',
        term: 'Michaelmas', // TODO: Calculate from current date
        weekOfTerm: 1, // TODO: Calculate from term start
        localTimeISO: now.toISOString(),
      },
      assignments: {
        upcoming,
        overdue,
        recentlyCreated,
        total: totalCount || 0,
      },
      schedule: {
        todaysClasses,
      },
    };

    return res.status(200).json(context);
  } catch (error: any) {
    console.error('Error fetching Durmah context:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
