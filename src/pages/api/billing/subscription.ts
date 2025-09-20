import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerUser } from '@/lib/api/serverAuth';
import { serverSubscriptionService } from '@/lib/billing/subscriptionService';

const ok = (res: NextApiResponse, body: Record<string, unknown> = {}) =>
  res.status(200).json({ ok: true, ...body });

const failSoft = (
  res: NextApiResponse,
  message: string,
  extra: Record<string, unknown> = {}
) => {
  console.warn('[billing/subscription] soft-fail:', message);
  return res.status(200).json({ ok: false, error: message, ...extra });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user } = await getServerUser(req, res);

  try {
    if (req.method === 'GET') {
      if (!user) {
        return ok(res, {
          subscription: {
            tier: 'free',
            inTrial: false,
            trialEndsAt: null,
            status: 'inactive',
          },
        });
      }

      const subscriptionInfo = await serverSubscriptionService.getUserSubscriptionInfo(user.id);
      return ok(res, { subscription: subscriptionInfo });
    }

    if (req.method === 'POST') {
      if (!user) {
        return failSoft(res, 'unauthenticated');
      }

      const { action } = req.body ?? {};
      if (action === 'start_trial') {
        const subscriptionId = await serverSubscriptionService.startUserTrial(user.id);
        return ok(res, {
          success: true,
          subscriptionId,
          message: 'Trial started successfully',
        });
      }
      return failSoft(res, 'invalid_action');
    }

    if (req.method === 'PUT') {
      if (!user) {
        return failSoft(res, 'unauthenticated');
      }

      const { updateAction } = req.body ?? {};
      if (updateAction === 'cancel') {
        await serverSubscriptionService.cancelSubscription(user.id);
        return ok(res, { success: true, message: 'Subscription cancelled successfully' });
      }
      if (updateAction === 'reactivate') {
        await serverSubscriptionService.reactivateSubscription(user.id);
        return ok(res, { success: true, message: 'Subscription reactivated successfully' });
      }
      return failSoft(res, 'invalid_action');
    }

    return failSoft(res, 'method_not_allowed');
  } catch (error: any) {
    const message = error?.message || 'subscription_error';
    return failSoft(res, message);
  }
}
