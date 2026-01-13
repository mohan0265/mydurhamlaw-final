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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check admin auth
  const token = parse(req.headers.cookie || '')[COOKIE_NAME];
  const exp = expectedToken();
  if (!token || !exp || token !== exp) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const adminClient = getSupabaseAdmin();
  if (!adminClient) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  const { connectionId } = req.body;

  if (!connectionId) {
    return res.status(400).json({ error: 'Missing connectionId' });
  }

  try {
    // Delete the AWY connection
    const { error } = await adminClient
      .from('awy_connections')
      .delete()
      .eq('id', connectionId);

    if (error) {
      throw error;
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Connection removed' 
    });

  } catch (error: any) {
    console.error('Remove connection error:', error);
    return res.status(500).json({ error: error.message || 'Failed to remove connection' });
  }
}
