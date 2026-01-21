// API Route: GET /api/durmah/history
// Purpose: Load user's conversation history for context-aware responses

import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { DurmahHistoryResponse } from '@/types/durmahPersistence';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DurmahHistoryResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createServerSupabaseClient({ req, res });

  // 1. Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { session_id, limit = '30' } = req.query;
    const messageLimit = Math.min(parseInt(limit as string, 10) || 30, 100);

    let targetSessionId: string | null = session_id as string || null;

    // 2. If no session_id provided, find or create the latest active session
    if (!targetSessionId) {
      const { data: session, error: sessionError } = await supabase.rpc(
        'get_or_create_durmah_session',
        { p_user_id: user.id, p_mode: 'voice' }
      );

      if (sessionError) {
        console.error('[history] get_or_create_durmah_session error:', sessionError);
        return res.status(500).json({ error: 'Failed to retrieve session' });
      }

      targetSessionId = session;
    }

    // 3. Fetch session details
    const { data: sessionData, error: sessionFetchError } = await supabase
      .from('durmah_sessions')
      .select('*')
      .eq('id', targetSessionId)
      .single();

    if (sessionFetchError || !sessionData) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // 4. Fetch last summary (if exists)
    let lastSummary = null;
    if (sessionData.last_summary_id) {
      const { data: summaryData } = await supabase
        .from('durmah_summaries')
        .select('*')
        .eq('id', sessionData.last_summary_id)
        .single();
      
      lastSummary = summaryData || null;
    }

    // 5. Fetch last N messages
    const { data: messages, error: messagesError } = await supabase
      .from('durmah_messages')
      .select('*')
      .eq('session_id', targetSessionId)
      .order('created_at', { ascending: false })
      .limit(messageLimit);

    if (messagesError) {
      console.error('[durmah/history] Messages query error:', messagesError);
    }

    // Reverse to chronological order
    const lastMessages = (messages || []).reverse();

    // 6. Fetch recent interest events (last 5 for context)
    const { data: interests } = await supabase
      .from('durmah_interest_events')
      .select('title, url, tags, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    console.log('[durmah/history] Loaded:', {
      session_id: sessionData?.id,
      summary: !!lastSummary,
      messages: lastMessages?.length || 0,
      interests: interests?.length || 0
    });

    const response: DurmahHistoryResponse = {
      latest_session: sessionData,
      last_summary: lastSummary,
      last_messages: lastMessages,
      recent_interests: (interests as any[]) || [],
      context_loaded: lastMessages.length > 0 || lastSummary !== null || (interests?.length || 0) > 0,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('[history] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
