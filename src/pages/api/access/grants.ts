// src/pages/api/access/grants.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerUser } from '@/lib/api/serverAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user, supabase } = await getServerUser(req, res);
  if (!user || !supabase) {
    return res.status(200).json({ ok: false, grants: [] });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const { data, error } = await supabase
    .from('user_access_grants')
    .select('grant_type, starts_at, expires_at, revoked_at')
    .eq('user_id', user.id)
    .is('revoked_at', null);

  if (error) {
    console.warn('[access/grants] error:', error);
    return res.status(200).json({ ok: false, grants: [] });
  }

  return res.status(200).json({ ok: true, grants: data || [] });
}
