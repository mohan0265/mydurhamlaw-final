import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Upserts a minimal AWY profile. If no user is provided, return 204 so we don't
 * pollute the console with 401s during logged-out browsing.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const userId = req.headers['x-user-id'] as string | undefined;
  const email = (req.headers['x-user-email'] as string | undefined) || null;

  if (!userId) {
    return res.status(204).json({ skipped: true });
  }

  try {
    // TODO: upsert to your profiles table if you want
    return res.status(200).json({ ok: true, userId, email });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'failed' });
  }
}
