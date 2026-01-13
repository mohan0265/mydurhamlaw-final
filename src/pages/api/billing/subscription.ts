import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerUser } from '@/lib/api/serverAuth';
import { serverSubscriptionService } from '@/lib/billing/subscriptionServiceServer';

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
  const { user, supabase } = await getServerUser(req, res);

  try {
    const buildFallback = async () => {
      if (!user || !supabase) {
        return {
          tier: 'free',
          inTrial: false,
          trialEndsAt: null,
          status: 'inactive',
        };
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('created_at, trial_started_at, trial_ends_at, trial_ever_used')
        .eq('id', user.id)
        .maybeSingle();

      // Use trial_ends_at from database if set (admin can customize trial length)
      // Otherwise, calculate from trial_started_at + 14 days
      let trialEndsAt: Date | null = null;
      
      if (profile?.trial_ends_at) {
        // Admin has set a specific trial end date
        trialEndsAt = new Date(profile.trial_ends_at);
      } else {
        // Calculate from trial start (legacy behavior)
        const trialStart =
          (profile?.trial_started_at && new Date(profile.trial_started_at)) ||
          (profile?.created_at && new Date(profile.created_at)) ||
          (user.created_at && new Date(user.created_at)) ||
          null;
        trialEndsAt = trialStart
          ? new Date(trialStart.getTime() + 14 * 24 * 60 * 60 * 1000)
          : null;
      }

      const inTrial = trialEndsAt ? new Date() < trialEndsAt : false;
      return {
        tier: 'free',
        inTrial,
        trialEndsAt: trialEndsAt ? trialEndsAt.toISOString() : null,
        status: inTrial ? 'trial' : 'inactive',
      };
    };

    if (req.method === 'GET') {
      if (!user) {
        return ok(res, { subscription: await buildFallback() });
      }

      try {
        const subscriptionInfo = await serverSubscriptionService.getUserSubscriptionInfo(user.id);
        const fallback = await buildFallback();
        if (subscriptionInfo) {
          // If the stored subscription says inactive but fallback says still in trial window, prefer fallback
          const merged =
            fallback.inTrial && (!subscriptionInfo.inTrial || subscriptionInfo.status === 'inactive')
              ? {
                  ...subscriptionInfo,
                  inTrial: true,
                  status: 'trial',
                  trialEndsAt: fallback.trialEndsAt,
                }
              : subscriptionInfo;
          return ok(res, { subscription: merged });
        }
      } catch (e) {
        console.warn('[billing/subscription] falling back to profile-based trial:', e);
      }

      return ok(res, { subscription: await buildFallback() });
    }

    if (req.method === 'POST') {
      if (!user) {
        return failSoft(res, 'unauthenticated');
      }

      const { action } = req.body ?? {};
      if (action === 'start_trial') {
        try {
          // One free trial per profile
          if (supabase) {
            const { data: prof } = await supabase
              .from('profiles')
              .select('trial_started_at, trial_ever_used')
              .eq('id', user.id)
              .maybeSingle();
            if (prof?.trial_ever_used || prof?.trial_started_at) {
              return ok(res, {
                success: false,
                error: 'trial_already_used',
              });
            }
            // stamp trial start
            await supabase
              .from('profiles')
              .update({
                trial_started_at: new Date().toISOString(),
                trial_ever_used: true,
              })
              .eq('id', user.id);
          }

          const subscriptionId = await serverSubscriptionService.startUserTrial(user.id);
          return ok(res, {
            success: true,
            subscriptionId,
            message: 'Trial started successfully',
          });
        } catch (e) {
          console.warn('[billing/subscription] start_trial fallback:', e);
          return ok(res, {
            success: true,
            subscriptionId: 'trial-started-fallback',
            message: 'Trial started successfully (fallback)',
          });
        }
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
