// API Route: List All AWY Connections
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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = parse(req.headers.cookie || '')[COOKIE_NAME];
  const exp = expectedToken();
  if (!token || !exp || token !== exp) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const adminClient = getSupabaseAdmin();
  if (!adminClient) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  try {
    // Fetch all AWY connections with profiles joined
    const { data: connections, error: connectionsError } = await adminClient
      .from('awy_connections')
      .select(`
        id,
        student_user_id,
        loved_user_id,
        loved_email,
        relationship,
        nickname,
        status,
        created_at,
        student:profiles!awy_connections_student_user_id_fkey(email),
        loved:profiles!awy_connections_loved_user_id_fkey(email)
      `)
      .order('created_at', { ascending: false })
      .limit(500);

    if (connectionsError) {
      return res.status(400).json({ error: connectionsError.message });
    }

    // Format response
    const formatted = (connections || []).map((conn: any) => ({
      id: conn.id,
      studentUserId: conn.student_user_id,
      studentEmail: conn.student?.email || '-',
      lovedUserId: conn.loved_user_id,
      lovedEmail: conn.loved_email || conn.loved?.email || '-',
      relationship: conn.relationship,
      nickname: conn.nickname,
      status: conn.status,
      createdAt: conn.created_at,
    }));

    return res.status(200).json({ connections: formatted });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
