import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let user = null;
  let supabase = null;

  // 1. Try Bearer Token (Header)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data, error } = await supabaseAnon.auth.getUser(token);
    if (!error && data.user) {
      user = data.user;
      // create a client with the user's token for RLS
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );
    }
  }

  // 2. Try Cookie (Standard Next.js helper)
  if (!user) {
    const supabaseCookies = createPagesServerClient({ req, res });
    const { data } = await supabaseCookies.auth.getUser();
    if (data.user) {
      user = data.user;
      supabase = supabaseCookies;
    }
  }

  if (!user || !supabase) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 1. Get connected students
    const { data: connections, error: connError } = await supabase
      .from('awy_connections')
      .select('student_id, student:profiles!student_id(display_name)')
      .eq('loved_one_id', user.id)
      .eq('status', 'active');

    if (connError) throw connError;

    const studentIds = connections?.map(c => c.student_id) || [];

    if (studentIds.length === 0) {
      return res.status(200).json({ ok: true, students: [] });
    }

    // 2. Get presence for these students
    // RLS policy "Loved ones can see student presence" enforces is_available = true
    const { data: presence, error: presError } = await supabase
      .from('awy_presence')
      .select('*')
      .in('user_id', studentIds);

    if (presError) throw presError;

    // Merge data
    const result = connections?.map(conn => {
      const p = presence?.find(p => p.user_id === conn.student_id);
      return {
        studentId: conn.student_id,
        displayName: (conn.student as any)?.display_name || 'Student',
        isAvailable: p?.is_available || false,
        lastSeen: p?.last_seen_at || null,
        status: p?.status || 'offline'
      };
    });

    return res.status(200).json({ ok: true, students: result });
  } catch (error: any) {
    console.error('Loved one view presence error:', error);
    return res.status(500).json({ error: error.message });
  }
}
