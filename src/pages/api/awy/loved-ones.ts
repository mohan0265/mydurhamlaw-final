import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserOrThrow } from '@/lib/apiAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let user, supabase;
  try {
    const auth = await getUserOrThrow(req, res);
    user = auth.user;
    supabase = auth.supabase;
  } catch {
    return;
  }

  try {
    const { data: connections, error } = await supabase
      .from('awy_connections')
      .select('*')
      .or(`student_id.eq.${user!.id},student_user_id.eq.${user!.id}`)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return res.status(200).json({ ok: true, connections });
  } catch (error: any) {
    console.error('Get loved ones error:', error);
    return res.status(500).json({ error: error.message });
  }
}
