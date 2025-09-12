
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
        // Get user's AWY connections
        const connections = await serverAWYService.getUserConnections(user.id);
        return res.status(200).json({ connections });

      case 'POST':
        // Create new AWY connection
        const { connectionEmail, relationshipLabel, displayName } = req.body;
        
        if (!connectionEmail || !relationshipLabel) {
          return res.status(400).json({ 
            error: 'Connection email and relationship label are required' 
          });
        }
        
        const connectionId = await serverAWYService.createConnection(
          user.id,
          connectionEmail,
          relationshipLabel,
          displayName
        );
        
        return res.status(201).json({ 
          success: true, 
          connectionId,
          message: 'Connection created successfully' 
        });

      case 'PUT':
        // Update connection (permissions, etc.)
        const { connectionId: updateConnectionId, permissions } = req.body;
        
        if (!updateConnectionId) {
          return res.status(400).json({ error: 'Connection ID is required' });
        }
        
        if (permissions) {
          await serverAWYService.updateConnectionPermissions(updateConnectionId, permissions);
          return res.status(200).json({ 
            success: true, 
            message: 'Connection permissions updated' 
          });
        }
        
        return res.status(400).json({ error: 'No valid update data provided' });

      case 'DELETE':
        // Delete connection
        const { connectionId: deleteId } = req.body;
        
        if (!deleteId) {
          return res.status(400).json({ error: 'Connection ID is required' });
        }
        
        await serverAWYService.deleteConnection(deleteId);
        return res.status(200).json({ 
          success: true, 
          message: 'Connection deleted successfully' 
        });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('AWY Connections API error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}
