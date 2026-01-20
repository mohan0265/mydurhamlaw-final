import type { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'cookie';
import { createHmac } from 'crypto';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';

const COOKIE_NAME = 'admin_session';

function expectedToken() {
  const adminUser = process.env.ADMIN_USERNAME;
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminUser || !adminPass) return null;
  return createHmac('sha256', adminPass).update(adminUser).digest('hex');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // 1. Verify Admin Auth
  const token = parse(req.headers.cookie || '')[COOKIE_NAME];
  const exp = expectedToken();
  if (!token || !exp || token !== exp) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { requestId } = req.body;
  if (!requestId) return res.status(400).json({ error: 'Missing requestId' });

  const adminClient = getSupabaseAdmin();
  if (!adminClient) return res.status(500).json({ error: 'Server misconfigured' });

  try {
    // 2. Update status to rejected
    const { error } = await adminClient
      .from('access_requests')
      .update({
        request_status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: (await adminClient.auth.getUser()).data.user?.id
      })
      .eq('id', requestId);

    if (error) throw error;

    return res.status(200).json({ success: true });

  } catch (error: any) {
    console.error('Rejection Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
