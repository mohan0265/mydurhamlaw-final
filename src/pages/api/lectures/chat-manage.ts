
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

    const { action, messageIds, lectureId } = req.body;

    if (!action || !lectureId) {
      return res.status(400).json({ error: 'Missing action or lectureId' });
    }

    if (action === 'delete_selected') {
        if (!messageIds || !Array.isArray(messageIds)) {
            return res.status(400).json({ error: 'Missing messageIds' });
        }
        
        const { error } = await supabase
            .from('lecture_chat_messages')
            .delete()
            .in('id', messageIds)
            .eq('user_id', user.id) // Security check
            .eq('lecture_id', lectureId);

        if (error) throw error;
        return res.status(200).json({ success: true });
    }

    if (action === 'clear_all') {
        const { error } = await supabase
            .from('lecture_chat_messages')
            .delete()
            .eq('lecture_id', lectureId)
            .eq('user_id', user.id);

        if (error) throw error;
        return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid action' });

  } catch (error: any) {
    console.error('Chat manage error:', error);
    return res.status(500).json({ error: error.message || 'Internal Error' });
  }
}
