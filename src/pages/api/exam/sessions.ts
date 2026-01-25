import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createPagesServerClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // GET: List recent sessions for module
  if (req.method === 'GET') {
      const { module_id, workspace_id } = req.query;
      if (!module_id || !workspace_id) return res.status(400).json({ error: 'params required' });

      const { data, error } = await supabase
          .from('exam_sessions')
          .select('*')
          .eq('workspace_id', workspace_id)
          .eq('user_id', session.user.id)
          .order('updated_at', { ascending: false });

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
  }

  // POST: Create (Open) a session
  if (req.method === 'POST') {
      const { module_id, workspace_id, session_title } = req.body;

      // Close previous open sessions? 
      // Policy: Allow multiple, but UI might enforce one 'active'.
      
      const { data, error } = await supabase
          .from('exam_sessions')
          .insert({
              user_id: session.user.id,
              module_id,
              workspace_id,
              session_title: session_title || 'Revision Session',
              status: 'open'
          })
          .select()
          .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
  }
}
