import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const supabase = createPagesServerClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { module_id, expected_count } = req.body;

  if (!module_id || typeof expected_count !== 'number') {
    return res.status(400).json({ error: 'Invalid parameters' });
  }

  // Upsert the lecture set settings
  const { data, error } = await supabase
    .from('module_lecture_sets')
    .upsert({
      user_id: session.user.id,
      module_id,
      expected_count,
      // triggers will handle is_complete logic based on uploaded_count
    }, { onConflict: 'user_id, module_id' })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Optional: Force a count recalc if needed, but trigger covers it.
  
  return res.status(200).json(data);
}
