import type { NextApiRequest, NextApiResponse } from 'next';
<parameter name="CreatePagesServerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import type { StudentContext } from '@/types/durmahContext';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * CHATGPT'S FINAL WIRING FIX
 * 
 * Now queries SAME sources as UI:
 * - `assignments` table (exactly like assignments.tsx line 42)
 * - `timetable_events` table (exactly like contextBuilder.ts line 244)
 * 
 * NO MORE empty arrays or total=0
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StudentContext | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let user: any = null;
    let authMethod: 'cookie' | 'bearer' | 'none' = 'none';
    let supabaseClient: any = null;

    // TRY METHOD 1: Cookie-based auth
    try {
      supabaseClient = createPagesServerClient({ req, res });
      const { data: { user: cookieUser }, error } = await supabaseClient.auth.getUser();
      if (cookieUser && !error) {
        user = cookieUser;
        authMethod = 'cookie';
        console.log('[context] ✓ Auth via cookies');
      }
    } catch (err) {
      console.warn('[context] Cookie auth failed:', err);
    }

    // TRY METHOD 2: Bearer token (if cookies failed)
    if (!user) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          supabaseClient = createClient(SUPABASE_URL, ANON_KEY, {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false },
          });
          const { data: { user: bearerUser }, error } = await supabaseClient.auth.getUser(token);
          if (bearerUser && !error) {
            user = bearerUser;
            authMethod = 'bearer';
            console.log('[context] ✓ Auth via bearer token');
          }
        } catch (err) {
          console.warn('[context] Bearer auth failed:', err);
        }
      }
    }

    // BOTH methods failed
    if (!user || !supabaseClient) {
      console.error('[context] ✗ Auth failed (both cookie and bearer)');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // FETCH: User profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('display_name, year_group, year_of_study')
      .eq('id', user.id)
      .maybeSingle();

    // FETCH: Assignments (EXACT same query as assignments.tsx line 42)
    const { data: assignmentsData } = await supabaseClient
      .from('assignments')
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true });

    // Categorize assignments
    const now = new Date();
    const assignments = assignmentsData || [];
    
    const upcoming = assignments.filter(a => 
      a.due_date && new Date(a.due_date) >= now && a.status !== 'completed'
    ).slice(0, 5);  // Top 5
    
    const overdue = assignments.filter(a =>
      a.due_date && new Date(a.due_date) < now && a.status !== 'completed'
    ).slice(0,  5);  // Top 5
    
    const recentlyCreated = assignments
      .filter(a => new Date(a.created_at) > new Date(now.getTime() - 7*24*60*60*1000))
      .slice(0, 3);  // Last 3

    // FETCH: Today's classes
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    
    const { data: todaysEvents } = await supabaseClient
      .from('timetable_events')
      .select('title, start_time, end_time, location, module_code')
      .eq('user_id', user.id)
      .gte('start_time', todayStart.toISOString())
      .lte('start_time', todayEnd.toISOString())
      .order('start_time', { ascending: true });

    // FETCH: Next 7 days classes (for richer context)
    const next7DaysEnd = new Date(now.getTime() + 7*24*60*60*1000);
    
    const { data: weekEvents } = await supabaseClient
      .from('timetable_events')
      .select('title, start_time, end_time, location, module_code')
      .eq('user_id', user.id)
      .gte('start_time', now.toISOString())
      .lte('start_time', next7DaysEnd.toISOString())
      .order('start_time', { ascending: true })
      .limit(10);

    // Build response
    const studentContext: StudentContext = {
      student: {
        displayName: profile?.display_name || user.email?.split('@')[0] || 'Student',
        yearGroup: profile?.year_of_study || profile?.year_group || 'Year 1',
        term: 'Epiphany',  // TODO: Compute from academic calendar
        weekOfTerm: 3,     // TODO: Compute from academic calendar
        localTimeISO: now.toISOString(),
      },
      assignments: {
        upcoming,
        overdue,
        recentlyCreated,
        total: assignments.length,
      },
      schedule: {
        todaysClasses: (todaysEvents || []).map(e => ({
          title: e.title,
          start: e.start_time,
          end: e.end_time,
          location: e.location,
        })),
      },
    };

    console.log(`[context] ✓ SUCCESS: term=${studentContext.student.term}, assignments total=${studentContext.assignments.total}, today classes=${studentContext.schedule.todaysClasses.length}`);
    
    return res.status(200).json(studentContext);

  } catch (error: any) {
    console.error('[context] ✗ Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
