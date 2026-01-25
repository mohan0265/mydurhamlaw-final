import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createPagesServerClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('user_id', session.user.id)
      .order('title', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { title, code, term } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const { data, error } = await supabase
      .from('modules')
      .insert({
        user_id: session.user.id,
        title,
        code: code || null,
        term: term || null
      })
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation on (user_id, code) gracefullly?
      if (error.code === '23505') { 
         // return existing if conflict
         const { data: existing } = await supabase
            .from('modules')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('code', code)
            .single();
         return res.status(200).json(existing);
      }
      return res.status(500).json({ error: error.message });
    }
    return res.status(201).json(data);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
