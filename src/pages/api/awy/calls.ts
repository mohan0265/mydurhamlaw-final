
import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { serverAWYService } from '@/lib/awy/awyService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = getSupabaseServerClient();
  
  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    switch (req.method) {
      case 'POST':
        // Initiate a call
        const { connectionId, recipientUserId, sessionType = 'video' } = req.body;
        
        if (!connectionId || !recipientUserId) {
          return res.status(400).json({ 
            error: 'Connection ID and recipient user ID are required' 
          });
        }
        
        const sessionId = await serverAWYService.initiateCall(
          connectionId,
          user.id,
          recipientUserId,
          sessionType
        );
        
        return res.status(201).json({ 
          success: true, 
          sessionId,
          message: 'Call initiated successfully' 
        });

      case 'PUT':
        // Update call session
        const { sessionId: updateSessionId, updates } = req.body;
        
        if (!updateSessionId || !updates) {
          return res.status(400).json({ 
            error: 'Session ID and updates are required' 
          });
        }
        
        await serverAWYService.updateCallSession(updateSessionId, updates);
        return res.status(200).json({ 
          success: true, 
          message: 'Call session updated successfully' 
        });

      case 'GET':
        // Get call session details
        const { sessionId: getSessionId } = req.query;
        
        if (!getSessionId) {
          return res.status(400).json({ error: 'Session ID is required' });
        }
        
        const session = await serverAWYService.getCallSession(getSessionId as string);
        return res.status(200).json({ session });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('AWY Calls API error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}
