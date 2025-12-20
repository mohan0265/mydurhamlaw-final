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
      .select('id, student_id, last_seen_at')
      .or(`loved_one_id.eq.${user.id},loved_user_id.eq.${user.id}`)
      .in('status', ['active', 'granted', 'accepted']);

    if (connError) throw connError;

    if (!connections || connections.length === 0) {
      return res.status(200).json({ ok: true, students: [] });
    }

    const studentIds = connections.map(c => c.student_id);
    const connectionIds = connections.map(c => c.id);

    // 1b. Update last_seen_at & Audit Log (Debounced)
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    // Check if we need to log audit (if any connection hasn't been seen in 5 mins)
    const shouldLogAudit = connections.some(c => 
      !c.last_seen_at || new Date(c.last_seen_at) < fiveMinutesAgo
    );

    if (shouldLogAudit) {
      // Parallel: Update last_seen_at and Insert Audit
      await Promise.all([
        supabase
          .from('awy_connections')
          .update({ last_seen_at: now.toISOString() })
          .in('id', connectionIds),
        
        // Log for each connection (technically one log per dashboard load per connection is safer for granular tracking)
        // constructing an array of inserts
        supabase.from('awy_audit_log').insert(
          connections.map(c => ({
            connection_id: c.id,
            action: 'view_dashboard',
            actor_user_id: user.id,
            actor_role: 'loved_one',
            details: { user_agent: req.headers['user-agent'] }
          }))
        )
      ]).catch(err => console.error('Failed to update presence logs:', err));
    }

    // 2. Fetch Profile Names Separately (Fixes 500 Error)
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', studentIds);
    
    // Map ID -> Name
    const nameMap = new Map();
    if (profiles) {
      profiles.forEach((p: any) => nameMap.set(p.id, p.display_name));
    }

    // 3. Get presence for these students
    const { data: presence, error: presError } = await supabase
      .from('awy_presence')
      .select('*')
      .in('user_id', studentIds);

    if (presError) throw presError;

    // Merge data
    const result = connections.map(conn => {
      const p = presence?.find(p => p.user_id === conn.student_id);
      const name = nameMap.get(conn.student_id) || 'Student';
      return {
        studentId: conn.student_id,
        displayName: name,
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
