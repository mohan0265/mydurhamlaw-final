import type { NextApiRequest, NextApiResponse } from 'next';
import { buildDurmahContext } from '@/lib/durmah/contextBuilder';
import { getApiAuth } from '@/lib/apiAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const result = await buildDurmahContext(req);
    if (!result.ok) {
      return res.status(result.status === 'unauthorized' ? 401 : 500).json({ ok: false });
    }
    return res.status(200).json({ ok: true, context: result.context });
  }

  if (req.method === 'POST') {
    const auth = await getApiAuth(req);
    if (auth.status === 'missing_token' || auth.status === 'invalid_token') {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
    if (auth.status === 'misconfigured') {
      return res.status(500).json({ ok: false, error: 'Configuration error' });
    }

    const { supabase, user } = auth;
    const { last_message } = req.body;
    
    // We update the thread's last_summary (acting as memory) and timestamp
    const { error } = await supabase
      .from('durmah_threads')
      .update({
        last_summary: last_message,
        last_message_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (error) {
      console.error("[DurmahMemory] Update failed:", error);
      return res.status(500).json({ ok: false });
    }

    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ ok: false, error: 'method_not_allowed' });
}
