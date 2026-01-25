import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createPagesServerClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    // List active workspaces with module details
    const { data, error } = await supabase
        .from('exam_workspaces')
        .select(`
            *,
            module:modules(id, title, code, term),
            lecture_set:module_lecture_sets!left(uploaded_count, expected_count, is_complete)
        `)
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .order('updated_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  res.setHeader('Allow', ['GET']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
