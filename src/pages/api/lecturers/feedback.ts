import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const supabase = createPagesServerClient({ req, res });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { lecturerId, feedback } = req.body;
  if (!lecturerId || !feedback) return res.status(400).json({ error: 'Missing data' });

  // Privacy: We rely on RLS, but double check user ownership
  // The table is: id, lecturer_id, user_id, pace, clarity, examples, best_tip, created_at
  
  const payload = {
      lecturer_id: lecturerId,
      user_id: user.id,
      pace: feedback.pace,
      clarity: feedback.clarity,
      examples: feedback.examples,
      best_tip: feedback.best_tip || null // Optional free text
  };

  const { error } = await supabase
    .from('lecturer_feedback')
    .upsert(payload, { onConflict: 'lecturer_id, user_id' });

  if (error) {
      console.error('Feedback save error', error);
      return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true });
}
