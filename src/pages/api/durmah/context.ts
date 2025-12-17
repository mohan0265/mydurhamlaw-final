import type { NextApiRequest, NextApiResponse } from 'next';
import { buildDurmahContext } from '@/lib/durmah/contextBuilder';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const result = await buildDurmahContext(req);
  if (!result.ok) {
    return res.status(result.status === 'unauthorized' ? 401 : 500).json({ ok: false });
  }

  return res.status(200).json({ ok: true, context: result.context });
}
