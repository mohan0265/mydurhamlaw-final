
import type { NextApiRequest, NextApiResponse } from 'next';
import durmahChatHandler from '../durmah/chat'; // Import the new handler
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { v5 as uuidv5 } from 'uuid';

/**
 * COMPATIBILITY WRAPPER
 * This endpoint intercepts legacy /api/lectures/chat requests and transparently
 * forwards them to the new unified /api/durmah/chat architecture.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { messages, lectureId, sessionId } = req.body;
        
        // 1. Extract last user message
        const lastMessage = messages?.[messages.length - 1];
        if (!lastMessage || !lastMessage.content) {
             return res.status(400).json({ error: 'No message content found' });
        }

        // 2. Resolve User ID for deterministic conversation ID generation
        const supabase = createPagesServerClient({ req, res });
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // 3. Generate Unified Conversation ID (Deterministic: UUIDv5(user.id + lectureId))
        // We use a fixed namespace for stability
        const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; 
        const conversationId = uuidv5(`${user.id}-${lectureId}`, NAMESPACE);

        // 4. Mutate Request Body to match new API Schema
        req.body = {
            message: lastMessage.content,
            conversationId: conversationId,
            source: 'lecture',      // Explicit source
            scope: 'lecture',       // Explicit scope
            visibility: 'ephemeral', // Default to ephemeral for legacy compat
            context: {
                lectureId: lectureId
            }
        };

        // 5. Forward to New Handler
        // Note: The new handler will handle the response (JSON). 
        // Legacy clients expecting EventStream will receive JSON, which usually requires client update.
        // Since we verified no internal consumers remain, this is acceptable.
        return durmahChatHandler(req, res);

    } catch (error: any) {
        console.error('[LegacyWrapper] Error forwarding request:', error);
        return res.status(500).json({ error: 'Internal Migration Error' });
    }
}
