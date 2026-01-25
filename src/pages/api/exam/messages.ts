import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createPagesServerClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // GET: List messages for a specific session
  if (req.method === 'GET') {
      const { session_id } = req.query;
      if (!session_id) return res.status(400).json({ error: 'session_id required' });

      const { data, error } = await supabase
          .from('exam_messages')
          .select('*')
          .eq('session_id', session_id)
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: true });

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
  }

  // POST: Send a new message (Student question OR Durmah response)
  if (req.method === 'POST') {
      const { module_id, workspace_id, session_id, role, message_md, artifact_id, source_refs } = req.body;

      // Validate session ownership first
      const { data: sess } = await supabase.from('exam_sessions').select('id').eq('id', session_id).eq('user_id', session.user.id).single();
      if (!sess) return res.status(403).json({ error: 'Invalid session' });

      const { data, error } = await supabase
          .from('exam_messages')
          .insert({
              user_id: session.user.id,
              module_id,
              workspace_id,
              session_id,
              role, // 'student' or 'durmah'
              message_md,
              artifact_id,
              source_refs: source_refs || []
          })
          .select()
          .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
