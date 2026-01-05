import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerUser } from '@/lib/api/serverAuth';
import { getSupabaseClient } from '@/lib/supabase/client';

/**
 * Assignment Progress Autosave API
 * 
 * GET  /api/assignment/progress?assignmentId=xxx
 *   - Fetches all saved progress for the given assignment
 *   - Returns: { success: true, progress: Array<ProgressRow> }
 * 
 * POST /api/assignment/progress
 *   - Upserts (insert or update) progress for one step
 *   - Body: { assignmentId, workflowKey, stepKey, content }
 *   - Returns: { success: true, progress: ProgressRow }
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Authenticate user
  const { user } = await getServerUser(req, res);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized - please sign in' });
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.status(500).json({ error: 'Database connection failed' });
  }

  // 2. Handle GET - fetch all progress for assignment
  if (req.method === 'GET') {
    const { assignmentId } = req.query;

    if (!assignmentId || typeof assignmentId !== 'string') {
      return res.status(400).json({ error: 'assignmentId query parameter required' });
    }

    try {
      const { data, error } = await supabase
        .from('assignment_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('assignment_id', assignmentId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('[progress GET] Supabase error:', error);
        return res.status(500).json({ error: 'Failed to fetch progress' });
      }

      return res.status(200).json({
        success: true,
        progress: data || [],
      });
    } catch (error: any) {
      console.error('[progress GET] Unexpected error:', error);
      return res.status(500).json({ error: error.message || 'Fetch failed' });
    }
  }

  // 3. Handle POST - upsert progress for one step
  if (req.method === 'POST') {
    const { assignmentId, workflowKey, stepKey, content } = req.body;

    // Validate required fields
    if (!assignmentId || !stepKey) {
      return res.status(400).json({ 
        error: 'Missing required fields: assignmentId, stepKey' 
      });
    }

    if (typeof content !== 'object') {
      return res.status(400).json({ error: 'content must be an object' });
    }

    try {
      // Upsert: insert if not exists, update if exists
      const { data, error } = await supabase
        .from('assignment_progress')
        .upsert(
          {
            user_id: user.id,
            assignment_id: assignmentId,
            workflow_key: workflowKey || 'default',
            step_key: stepKey,
            content,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,assignment_id,step_key',
          }
        )
        .select()
        .single();

      if (error) {
        console.error('[progress POST] Supabase error:', error);
        return res.status(500).json({ error: 'Failed to save progress' });
      }

      console.log('[progress POST] Saved successfully:', {
        userId: user.id,
        assignmentId,
        stepKey,
        updatedAt: data.updated_at,
      });

      return res.status(200).json({
        success: true,
        progress: data,
      });
    } catch (error: any) {
      console.error('[progress POST] Unexpected error:', error);
      return res.status(500).json({ error: error.message || 'Save failed' });
    }
  }

  // 4. Unsupported method
  return res.status(405).json({ error: 'Method not allowed' });
}
