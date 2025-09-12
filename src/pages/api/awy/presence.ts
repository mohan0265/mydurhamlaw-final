
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
      case 'GET':
        // Get presence data for user's connections
        const presenceData = await serverAWYService.getPresenceForConnections(user.id);
        return res.status(200).json({ presence: presenceData });

      case 'POST':
        // Update user's presence
        const presenceUpdate = req.body;
        
        await serverAWYService.updatePresence(user.id, presenceUpdate);
        return res.status(200).json({ 
          success: true, 
          message: 'Presence updated successfully' 
        });

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('AWY Presence API error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}
