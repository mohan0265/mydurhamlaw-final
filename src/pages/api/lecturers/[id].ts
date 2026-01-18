import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Missing ID' });

  try {
    const supabase = createPagesServerClient({ req, res });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // Fetch details
    const { data: lecturer, error } = await supabase
      .from('lecturers')
      .select(`
        *,
        lecturer_insights (*),
        lecturer_feedback!lecturer_feedback_lecturer_id_fkey (*) -- Optional: get aggregate? Or user specific?
      `)
      .eq('id', id)
      .single();
      
    if (error) throw error;

    // Fetch user's own feedback if any
    const { data: myFeedback } = await supabase
      .from('lecturer_feedback')
      .select('*')
      .eq('lecturer_id', id)
      .eq('user_id', user.id)
      .single();

    return res.status(200).json({ lecturer, myFeedback });

  } catch (err: any) {
    console.error('Error fetching lecturer:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
