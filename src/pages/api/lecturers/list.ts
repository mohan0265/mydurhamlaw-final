import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createPagesServerClient({ req, res });
    
    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // List lecturers with insights
    const { data: lecturers, error } = await supabase
      .from('lecturers')
      .select(`
        id,
        name,
        lecturer_insights (
          lecture_count
        )
      `)
      .order('name');

    if (error) throw error;

    // Transform for UI
    const formatted = lecturers.map(l => ({
      id: l.id,
      name: l.name,
      lectureCount: l.lecturer_insights?.[0]?.lecture_count || 0, // One-to-one
    }));

    return res.status(200).json({ lecturers: formatted });

  } catch (err: any) {
    console.error('Error listing lecturers:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
