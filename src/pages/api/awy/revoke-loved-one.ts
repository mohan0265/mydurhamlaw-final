// src/pages/api/awy/revoke-loved-one.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { supabaseAdmin } from '@/lib/server/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createPagesServerClient({ req, res });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { connectionId, lovedOneEmail } = req.body;

    if (!connectionId && !lovedOneEmail) {
      return res.status(400).json({ error: 'Missing connectionId or lovedOneEmail' });
    }

    let query = supabaseAdmin
      .from('awy_connections')
      .update({
        status: 'revoked',
        revoked_at: new Date().toISOString(),
        revoked_by: user.id
      })
      .eq('student_id', user.id); // Security: Ensure student owns this connection

    if (connectionId) {
      query = query.eq('id', connectionId);
    } else {
      query = query.eq('loved_email', lovedOneEmail); // case sensitive? usually emails are lowercased in DB
    }

    const { data, error } = await query
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Connection not found' });

    // Audit Log
    await supabaseAdmin.from('awy_audit_log').insert({
      connection_id: data.id,
      action: 'revoke',
      actor_user_id: user.id,
      actor_role: 'student',
      details: { reason: 'Student revoked access' }
    });

    return res.status(200).json({ ok: true, connection: data });
  } catch (error: any) {
    console.error('Revoke loved one error:', error);
    return res.status(500).json({ error: error.message });
  }
}
