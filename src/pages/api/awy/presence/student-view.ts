import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createPagesServerClient({ req, res });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 1. Get all active loved ones
    const { data: connections, error: connError } = await supabase
      .from('awy_connections')
      .select('loved_one_id')
      .eq('student_id', user.id)
      .eq('status', 'active')
      .not('loved_one_id', 'is', null);

    if (connError) throw connError;

    const lovedOneIds = connections?.map(c => c.loved_one_id) || [];

    if (lovedOneIds.length === 0) {
      return res.status(200).json({ ok: true, presence: [] });
    }

    // 2. Get presence for these users
    // RLS policy "Students can see loved ones presence" should allow this
    const { data: presence, error: presError } = await supabase
      .from('awy_presence')
      .select('*')
      .in('user_id', lovedOneIds);

    if (presError) throw presError;

    return res.status(200).json({ ok: true, presence });
  } catch (error: any) {
    console.error('Student view presence error:', error);
    return res.status(500).json({ error: error.message });
  }
}
