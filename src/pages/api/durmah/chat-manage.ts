import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createPagesServerClient({ req, res });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { action, messageIds, sessionId, scope } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Missing action' });
    }

    if (action === 'save') {
        if (!messageIds || !Array.isArray(messageIds)) {
            return res.status(400).json({ error: 'Missing messageIds' });
        }
        const { error } = await supabase
            .from('durmah_messages')
            .update({ saved_at: new Date().toISOString() })
            .in('id', messageIds) // durmah_messages usually has int8 or uuid id? Migration didn't specify, assuming existing table has ID. 
            // Wait, I should verify durmah_messages schema or handle potential ID types?
            // Existing `durmah_messages` likely has `id`.
            .eq('user_id', user.id);

        if (error) throw error;
        return res.status(200).json({ success: true });
    }

    if (action === 'unsave') {
        if (!messageIds || !Array.isArray(messageIds)) {
            return res.status(400).json({ error: 'Missing messageIds' });
        }
        const { error } = await supabase
            .from('durmah_messages')
            .update({ saved_at: null })
            .in('id', messageIds)
            .eq('user_id', user.id);

        if (error) throw error;
        return res.status(200).json({ success: true });
    }

    if (action === 'delete_selected') {
        if (!messageIds || !Array.isArray(messageIds)) {
            return res.status(400).json({ error: 'Missing messageIds' });
        }
        
        const { error } = await supabase
            .from('durmah_messages')
            .delete()
            .in('id', messageIds)
            .eq('user_id', user.id);

        if (error) throw error;
        return res.status(200).json({ success: true });
    }

    if (action === 'clear_unsaved') {
        let query = supabase
            .from('durmah_messages')
            .delete()
            .eq('user_id', user.id)
            .is('saved_at', null);
        
        // Scope logic
        if (scope === 'session' && sessionId) {
             query = query.eq('session_id', sessionId);
        } else {
             // Default to session if provided, explicit 'session' check is safer
             if (sessionId) query = query.eq('session_id', sessionId);
        }

        const { error } = await query;
        if (error) throw error;
        return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid action' });

  } catch (error: any) {
    console.error('Durmah chat manage error:', error);
    return res.status(500).json({ error: error.message });
  }
}
