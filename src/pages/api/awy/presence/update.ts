import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createPagesServerClient({ req, res });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { is_available } = req.body;

  if (typeof is_available !== 'boolean') {
    return res.status(400).json({ error: 'is_available boolean required' });
  }

  try {
    // Call the RPC function we defined in migration
    const { error } = await supabase.rpc('awy_heartbeat', {
      p_is_available: is_available
    });

    if (error) throw error;

    return res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error('Presence update error:', error);
    return res.status(500).json({ error: error.message });
  }
}
