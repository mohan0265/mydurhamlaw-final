import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  done: boolean;
  cta: string;
  href: string;
  helpDocCategory: string;
}

interface OnboardingStatus {
  ok: boolean;
  percent: number;
  completed: number;
  total: number;
  steps: OnboardingStep[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OnboardingStatus | { ok: false; error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  // Authenticate
  const supabase = createServerSupabaseClient({ req, res });
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('[onboarding/status] Auth error:', authError?.message);
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  const userId = user.id;

  try {
    // Compute completion from source tables
    
    // 1. Timetable: timetable_events OR user_events
    const { count: timetableCount } = await supabase
      .from('timetable_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .limit(1);

    const { count: userEventsCount } = await supabase
      .from('user_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('deleted_at', null)
      .limit(1);

    const timetable_done = (timetableCount || 0) > 0 || (userEventsCount || 0) > 0;

    // 2. Assignments
    const { count: assignmentCount } = await supabase
      .from('assignments')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .limit(1);

    const assignment_done = (assignmentCount || 0) > 0;

    // 3. Lectures
    const { count: lectureCount } = await supabase
      .from('lectures')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .limit(1);

    const lecture_done = (lectureCount || 0) > 0;

    // 4. AWY: active connections
    const { count: awyCount } = await supabase
      .from('awy_connections')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', userId)
      .eq('status', 'active')
      .limit(1);

    const awy_done = (awyCount || 0) > 0;

    // Upsert to user_onboarding cache
    const nowIso = new Date().toISOString();
    await supabase
      .from('user_onboarding')
      .upsert({
        user_id: userId,
        timetable_done,
        assignment_done,
        lecture_done,
        awy_done,
        last_checked_at: nowIso,
        updated_at: nowIso,
      }, { onConflict: 'user_id' });

    // Build response
    const steps: OnboardingStep[] = [
      {
        id: 'timetable',
        title: 'Connect your timetable',
        description: 'Import your ICS calendar or sync with Durham timetable',
        done: timetable_done,
        cta: 'Connect',
        href: '/profile-timetable',
        helpDocCategory: 'timetable',
      },
      {
        id: 'assignment',
        title: 'Add your first assignment',
        description: 'Track deadlines and structure your work',
        done: assignment_done,
        cta: 'Add Assignment',
        href: '/study/assignments',
        helpDocCategory: 'assignments',
      },
      {
        id: 'lecture',
        title: 'Import a Panopto lecture',
        description: 'Get AI-powered summaries and notes',
        done: lecture_done,
        cta: 'Import Lecture',
        href: '/study/lectures',
        helpDocCategory: 'lectures',
      },
      {
        id: 'awy',
        title: 'Connect with a loved one',
        description: 'Add family or friends to Always With You',
        done: awy_done,
        cta: 'Add Loved One',
        href: '/awy',
        helpDocCategory: 'awy',
      },
    ];

    const completed = steps.filter(s => s.done).length;
    const total = steps.length;
    const percent = Math.round((completed / total) * 100);

    console.log(`[onboarding/status] User ${userId}: ${completed}/${total} (${percent}%)`);

    return res.status(200).json({
      ok: true,
      percent,
      completed,
      total,
      steps,
    });

  } catch (error: any) {
    console.error('[onboarding/status] Error:', error);
    return res.status(500).json({ ok: false, error: error?.message || 'internal_error' });
  }
}
