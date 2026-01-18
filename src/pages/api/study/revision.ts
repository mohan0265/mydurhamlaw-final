import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createPagesServerClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'POST') {
    const { lecture_id, topic_title, notes } = req.body;
    
    if (!lecture_id || !topic_title) {
        return res.status(400).json({ error: 'Missing lecture_id or topic_title' });
    }

    const { data, error } = await supabase
      .from('revision_items')
      .insert({
        user_id: session.user.id,
        lecture_id,
        topic_title,
        notes
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
