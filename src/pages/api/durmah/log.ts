// API Route: POST /api/durmah/log
// Purpose: Log user and assistant messages for persistence

import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

interface LogRequestBody {
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  meta?: Record<string, any>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createServerSupabaseClient({ req, res });

  // 1. Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { session_id, role, content, meta }: LogRequestBody = req.body;

    if (!session_id || !role || !content) {
      return res.status(400).json({ error: 'Missing required fields: session_id, role, content' });
    }

    // 2. Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('durmah_sessions')
      .select('id')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return res.status(403).json({ error: 'Invalid session' });
    }

    // 3. Insert message
    const { error: insertError } = await supabase
      .from('durmah_messages')
      .insert({
        session_id,
        user_id: user.id,
        role,
        content,
        meta: meta || null,
      });

    if (insertError) {
      console.error('[log] Insert error:', insertError);
      return res.status(500).json({ error: 'Failed to log message' });
    }

    // 4. Update session activity timestamp
    await supabase.rpc('touch_durmah_session', { p_session_id: session_id });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[log] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
