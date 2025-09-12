
import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { serverSubscriptionService } from '@/lib/billing/subscriptionService';

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
        // Get user's usage data
        const { feature_type } = req.query;
        const usage = await serverSubscriptionService.getUserUsage(
          user.id, 
          feature_type as string
        );
        return res.status(200).json({ usage });

      case 'POST':
        // Track usage
        const { featureType, usageCount = 1, metadata = {} } = req.body;
        
        if (!featureType) {
          return res.status(400).json({ error: 'Feature type is required' });
        }
        
        await serverSubscriptionService.trackUsage(
          user.id, 
          featureType, 
          usageCount, 
          metadata
        );
        
        return res.status(200).json({ 
          success: true, 
          message: 'Usage tracked successfully' 
        });

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Usage API error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}
