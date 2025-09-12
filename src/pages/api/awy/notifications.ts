
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
        // Get user's notifications
        const { unread_only = 'false' } = req.query;
        const notifications = await serverAWYService.getUserNotifications(
          user.id, 
          unread_only === 'true'
        );
        return res.status(200).json({ notifications });

      case 'PUT':
        // Mark notification(s) as read
        const { notificationId, markAllAsRead } = req.body;
        
        if (markAllAsRead) {
          await serverAWYService.markAllNotificationsAsRead(user.id);
          return res.status(200).json({ 
            success: true, 
            message: 'All notifications marked as read' 
          });
        }
        
        if (notificationId) {
          await serverAWYService.markNotificationAsRead(notificationId);
          return res.status(200).json({ 
            success: true, 
            message: 'Notification marked as read' 
          });
        }
        
        return res.status(400).json({ 
          error: 'Either notificationId or markAllAsRead must be provided' 
        });

      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('AWY Notifications API error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}
