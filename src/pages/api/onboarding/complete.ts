import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createServerSupabaseClient({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { task_key, metadata } = req.body;

  if (!task_key) {
    return res.status(400).json({ error: 'Missing task_key' });
  }

  try {
    const userId = session.user.id;

    // Verify task exists (optional but good for data integrity)
    // Actually, foreign key constraint handles it, but let's just upsert.
    
    // Upsert completion
    const { data, error } = await supabase
      .from('user_onboarding_tasks')
      .upsert({
        user_id: userId,
        task_key: task_key,
        completed: true,
        completed_at: new Date().toISOString(),
        metadata: metadata || {},
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
        // If foreign key violation (invalid task_key), return 400
        if (error.code === '23503') { // foreign_key_violation
            return res.status(400).json({ error: 'Invalid task_key' });
        }
        throw error;
    }

    return res.status(200).json({ success: true, completion: data });
  } catch (err: any) {
    console.error('[Onboarding Complete] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
