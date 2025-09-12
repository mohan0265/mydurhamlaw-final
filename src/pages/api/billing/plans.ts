
import { NextApiRequest, NextApiResponse } from 'next';
import { subscriptionService } from '@/lib/billing/subscriptionService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const plans = await subscriptionService.getSubscriptionPlans();
    return res.status(200).json({ plans });
  } catch (error: any) {
    console.error('Plans API error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to fetch subscription plans' 
    });
  }
}
