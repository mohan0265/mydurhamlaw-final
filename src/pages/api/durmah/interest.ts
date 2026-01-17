// API Route: POST /api/durmah/interest
// Purpose: Log student interest events (e.g., clicking "Get AI Analysis" on news)

import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Authenticate user
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = user.id;

    // 2. Validate request body
    const { event_type, source, title, url, snippet, tags } = req.body;

    if (!event_type || !source) {
      return res.status(400).json({ 
        error: 'Missing required fields: event_type, source' 
      });
    }

    // 3. Insert interest event
    const { data, error } = await supabase
      .from('durmah_interest_events')
      .insert([{
        user_id: userId,
        event_type,
        source,
        title: title || null,
        url: url || null,
        snippet: snippet || null,
        tags: tags || null
      }])
      .select('id')
      .single();

    if (error) {
      console.error('[durmah/interest] Insert error:', error);
      return res.status(500).json({ error: 'Failed to log interest event' });
    }

    console.log('[durmah/interest] Event logged:', {
      event_id: data?.id,
      user_id: userId,
      event_type,
      source
    });

    return res.status(200).json({ 
      success: true, 
      event_id: data?.id 
    });

  } catch (error) {
    console.error('[durmah/interest] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
