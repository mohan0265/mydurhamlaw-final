import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createPagesServerClient({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = session.user.id;

  if (req.method === 'GET') {
    // Get latest entries
    const { data, error } = await supabase
      .from('wellbeing_checkins')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  } else if (req.method === 'POST') {
    // Add new entry
    const { mood, stress, sleep, note } = req.body;

    if (!mood || !stress) {
      return res.status(400).json({ error: 'Mood and stress are required' });
    }

    const { data, error } = await supabase
      .from('wellbeing_checkins')
      .insert({
        user_id: userId,
        mood,
        stress: stress || 0, // Handling if stress missing or logic mismatch, though interface matches
        note: note || '',
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
