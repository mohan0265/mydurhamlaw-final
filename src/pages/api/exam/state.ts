import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createPagesServerClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // GET: Retrieve state for a module
  if (req.method === 'GET') {
      const { module_id } = req.query;
      if (!module_id) return res.status(400).json({ error: 'module_id required' });

      // First get workspace id for this module
      const { data: workspace } = await supabase
          .from('exam_workspaces')
          .select('id')
          .eq('module_id', module_id)
          .eq('user_id', session.user.id)
          .single();
      
      if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

      const { data, error } = await supabase
          .from('exam_workspace_state')
          .select('*')
          .eq('workspace_id', workspace.id)
          .eq('user_id', session.user.id)
          .single();
      
      if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message });
      
      // Return default if no state yet
      return res.status(200).json(data || { last_tab: 'plan' });
  }

  // POST: UPSERT state
  if (req.method === 'POST') {
      const { module_id, last_tab, last_artifact_id, last_scroll_anchor } = req.body;
      
      const { data: workspace } = await supabase
          .from('exam_workspaces')
          .select('id')
          .eq('module_id', module_id)
          .eq('user_id', session.user.id)
          .single();

      if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

      const { data, error } = await supabase
          .from('exam_workspace_state')
          .upsert({
              user_id: session.user.id,
              workspace_id: workspace.id,
              module_id,
              last_tab,
              last_artifact_id: last_artifact_id || null,
              last_scroll_anchor: last_scroll_anchor || null,
              last_opened_at: new Date().toISOString() // refresh timestamp
          }, { onConflict: 'user_id, workspace_id' })
          .select()
          .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
