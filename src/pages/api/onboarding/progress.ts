import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createServerSupabaseClient({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = session.user.id;

  try {
    // 1. Fetch static tasks definition
    const { data: tasksDef, error: tasksError } = await supabase
      .from('onboarding_tasks')
      .select('*')
      .order('sort_order', { ascending: true });

    if (tasksError) throw tasksError;
    if (!tasksDef) throw new Error('No onboarding tasks defined');

    // 2. Fetch user's existing progress
    const { data: userProgress, error: progressError } = await supabase
      .from('user_onboarding_tasks')
      .select('*')
      .eq('user_id', userId);

    if (progressError) throw progressError;

    // Map existing progress by key
    const progressMap = new Map();
    userProgress?.forEach((p) => progressMap.set(p.task_key, p));

    // 3. Run Auto-Detectors for uncompleted tasks
    // We only try to detect if NOT already marked completed in DB
    const updates: Promise<any>[] = [];

    // Detector logic
    const detect = async (key: string) => {
      // If already done, skip
      if (progressMap.get(key)?.completed) return;

      let isDone = false;
      try {
        switch (key) {
          case 'add_first_lecture': {
            const { count } = await supabase
              .from('lectures')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', userId);
            if (count && count > 0) isDone = true;
            break;
          }
          case 'add_first_assignment': {
            const { count } = await supabase
              .from('assignments')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', userId);
            if (count && count > 0) isDone = true;
            break;
          }
           case 'connect_timetable': {
             // Check profiles.timetable_ics_url OR timetable_events count
             const { data: profile } = await supabase
                .from('profiles')
                .select('timetable_ics_url')
                .eq('id', userId)
                .single();
             
             if (profile?.timetable_ics_url) {
                isDone = true;
             } else {
                 const { count } = await supabase
                    .from('timetable_events') // Ensure this table exists
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', userId);
                 if (count && count > 0) isDone = true;
             }
             break;
           }
           case 'setup_awy': {
             // awy_connections
             const { count } = await supabase
               .from('awy_connections')
               .select('*', { count: 'exact', head: true })
               .or(`user_id.eq.${userId},loved_email.eq.${session.user.email || ''}`); 
             if (count && count > 0) isDone = true;
             break;
           }
           case 'try_durmah': {
             // durmah_messages (if exists) or skip auto-detect if purely manual
             // We'll try to check durmah_messages if widely used
             // If table might not exist, wrap in try/catch safely or skip
             // Assuming durmah_messages exists from migration analysis
             try {
                const { count } = await supabase
                    .from('durmah_messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', userId);
                if (count && count > 0) isDone = true; 
             } catch (e) {
                 // ignore
             }
             break;
           }
        }
      } catch (err) {
        console.warn(`[Onboarding] Detector failed for ${key}`, err);
      }

      if (isDone) {
        // Queue upsert
        updates.push(
          supabase
            .from('user_onboarding_tasks')
            .upsert({
              user_id: userId,
              task_key: key,
              completed: true,
              completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }) as any
        );
        // Update local map to reflect it
        progressMap.set(key, { completed: true, completed_at: new Date().toISOString() });
      }
    };

    // Run detectors in parallel
    await Promise.allSettled(tasksDef.map((t) => detect(t.task_key)));

    // Wait for DB upserts to finish (fire and forget? No, we want accurate response)
    await Promise.allSettled(updates);

    // 4. Calculate Stats
    let completedCount = 0;
    let totalRequired = 0;
    let completedRequired = 0;

    const finalTasks = tasksDef.map((t) => {
      const p = progressMap.get(t.task_key);
      const isCompleted = !!p?.completed;
      
      if (isCompleted) completedCount++;
      if (!t.optional) {
        totalRequired++;
        if (isCompleted) completedRequired++;
      }

      return {
        ...t,
        completed: isCompleted,
        completed_at: p?.completed_at || null,
      };
    });

    const percent = totalRequired > 0 
      ? Math.round((completedRequired / totalRequired) * 100) 
      : 100;

    return res.status(200).json({
      percent,
      completedCount,
      totalCount: tasksDef.length,
      tasks: finalTasks,
    });

  } catch (err: any) {
    console.error('[Onboarding] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
