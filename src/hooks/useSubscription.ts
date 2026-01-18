
import { useState, useEffect } from 'react';
import type { SubscriptionInfo } from '@/types/billing';
import { isProAccess, type AccessGrant } from '@/lib/billing/isProAccess';

export const useSubscription = (userId?: string) => {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [grants, setGrants] = useState<AccessGrant[]>([]);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchSubscription();
    }
  }, [userId]);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/billing/subscription');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch subscription');
      }
      
      setSubscription(data.subscription);

      // Fetch temporary grants
      try {
        const grantsRes = await fetch('/api/access/grants');
        const grantsJson = await grantsRes.json();
        const grantsList: AccessGrant[] = grantsJson?.grants || [];
        setGrants(grantsList);
        
        const computed = isProAccess(data.subscription, grantsList);
        setIsPro(computed);
      } catch (e) {
        console.error('Failed to fetch grants', e);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const startTrial = async () => {
    try {
      const response = await fetch('/api/billing/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start_trial' })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start trial');
      }

      // Refresh subscription data
      await fetchSubscription();
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const cancelSubscription = async () => {
    try {
      const response = await fetch('/api/billing/subscription', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updateAction: 'cancel' })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      // Refresh subscription data
      await fetchSubscription();
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const reactivateSubscription = async () => {
    try {
      const response = await fetch('/api/billing/subscription', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updateAction: 'reactivate' })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reactivate subscription');
      }

      // Refresh subscription data
      await fetchSubscription();
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const hasFeatureAccess = (featureName: string): boolean => {
    if (!subscription) return false;
    
    // Check if subscription is active or in trial
    if (!['active', 'trial'].includes(subscription.status) && !isPro) {
      return false;
    }

    // If Pro via Stripe OR grants → allow all Pro-tier features
    if (isPro) return true;
    
    // Check if feature is in the plan
    return subscription.features.includes(featureName);
  };

  const getTrialDaysRemaining = (): number => {
    if (!subscription || subscription.status !== 'trial' || !subscription.trial_end_date) {
      return 0;
    }

    const trialEnd = new Date(subscription.trial_end_date);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  };

  const isTrialExpired = (): boolean => {
    return subscription?.status === 'trial' && getTrialDaysRemaining() === 0;
  };

  const canUseAWY = (): boolean => {
    return hasFeatureAccess('Full AI Chat Access') || hasFeatureAccess('Unlimited AI Chat');
  };

  const getAWYConnectionLimit = (): number => {
    return subscription?.max_awy_connections || 0;
  };

  const getAIChatLimit = (): number => {
    return subscription?.ai_chat_limit || 0;
  };

  return {
    subscription,
    loading,
    error,
    startTrial,
    cancelSubscription,
    reactivateSubscription,
    hasFeatureAccess,
    getTrialDaysRemaining,
    isTrialExpired,
    canUseAWY,
    getAWYConnectionLimit,
    getAIChatLimit,
    refetch: fetchSubscription,
    isPro,
    grants
  };
};
