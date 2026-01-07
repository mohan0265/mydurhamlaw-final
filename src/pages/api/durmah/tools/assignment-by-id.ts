import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

/**
 * Durmah Tool: Get Assignment By ID
 * 
 * Allows Durmah to fetch full details of a specific assignment.
 * Used for answering queries like:
 * - "How's my Contract Law essay going?"
 * - "What's the question for my Legal Research assignment?"
 * 
 * Authentication: Required (uses Supabase session)
 * RLS: Enforced (only returns assignments belonging to requesting user)
 */

interface AssignmentDetails {
  id: string;
  title: string;
  question: string | null;
  module_id: string | null;
  module_code: string | null;
  module_name: string | null;
  due_date: string;
  status: string;
  progress: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AssignmentDetails | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. AUTH CHECK
    const supabase = createPagesServerClient({ req, res });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('[assignment-by-id] Auth error:', authError);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 2. VALIDATE PARAMS
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid assignment id' });
    }

    console.log(`[assignment-by-id] Fetching assignment ${id} for user ${user.id}`);

    // 3. FETCH ASSIGNMENT with RLS check
    const { data: assignment, error: fetchError } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)  // CRITICAL: RLS enforcement
      .single();

    if (fetchError || !assignment) {
      console.error('[assignment-by-id] Not found or access denied:', fetchError);
      return res.status(404).json({ 
        error: 'Assignment not found or you do not have permission to view it' 
      });
    }

    console.log(`[assignment-by-id] Found assignment: ${assignment.title}`);

    // 4. RETURN RESPONSE
    return res.status(200).json({
      id: assignment.id,
      title: assignment.title,
      question: assignment.question,
      module_id: assignment.module_id,
      module_code: assignment.module_code,
      module_name: assignment.module_name,
      due_date: assignment.due_date,
      status: assignment.status,
      progress: assignment.progress,
      notes: assignment.notes,
      created_at: assignment.created_at,
      updated_at: assignment.updated_at,
    });

  } catch (error: any) {
    console.error('[assignment-by-id] Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}
