// GET /api/durmah/tools/lecture-by-id?id=...
// Durmah tool: Fetches full lecture details including notes for discussion
import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Lecture ID is required' });
  }

  try {
    const supabase = createPagesServerClient({ req, res });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get lecture with notes (no transcript for Durmah - too large)
    const { data: lecture, error: lectureError } = await supabase
      .from('lectures')
      .select(`
        id, title, module_code, module_name, lecturer_name, lecture_date, status,
        lecture_notes (summary, key_points, discussion_topics, exam_prompts, glossary, engagement_hooks)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (lectureError || !lecture) {
      return res.status(404).json({ error: 'Lecture not found' });
    }

    // Flatten for Durmah consumption
    const notes = (lecture as any).lecture_notes || {};
    
    return res.status(200).json({
      id: lecture.id,
      title: lecture.title,
      module_code: lecture.module_code,
      module_name: lecture.module_name,
      lecturer_name: lecture.lecturer_name,
      lecture_date: lecture.lecture_date,
      status: lecture.status,
      // Notes content for discussion
      summary: notes.summary || null,
      key_points: notes.key_points || [],
      discussion_topics: notes.discussion_topics || [],
      exam_prompts: notes.exam_prompts || [],
      glossary: notes.glossary || [],
      engagement_hooks: notes.engagement_hooks || [],
    });

  } catch (error: any) {
    console.error('[durmah/tools/lecture-by-id] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
