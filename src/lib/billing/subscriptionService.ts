
import { getSupabaseClient } from '@/lib/supabase/client';
import type { SubscriptionPlan, UserSubscription, SubscriptionInfo } from '@/types/billing';
import type { SupabaseClient } from '@supabase/supabase-js';

export class SubscriptionService {
  private supabase: any;

  constructor(client?: SupabaseClient) {
    this.supabase = client || getSupabaseClient();
  }

  private ensureSupabase(): any {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }
    return this.supabase;
  }

  // Get all active subscription plans
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await this.ensureSupabase()
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true });

    if (error) {
      console.error('Error fetching subscription plans:', error);
      throw new Error('Failed to fetch subscription plans');
    }

    return data || [];
  }

  // Get user's current subscription info
  async getUserSubscriptionInfo(userId: string): Promise<SubscriptionInfo | null> {
    const { data, error } = await this.ensureSupabase()
      .rpc('get_user_subscription_info', { user_id_param: userId });

    if (error) {
      console.error('Error fetching user subscription:', error);
      throw new Error('Failed to fetch subscription info');
    }

    return data?.[0] || null;
  }

  // Check if user has access to a specific feature
  async userHasFeatureAccess(userId: string, featureName: string): Promise<boolean> {
    const { data, error } = await this.ensureSupabase()
      .rpc('user_has_feature_access', { 
        user_id_param: userId, 
        feature_name: featureName 
      });

    if (error) {
      console.error('Error checking feature access:', error);
      return false;
    }

    return data || false;
  }

  // Start trial for new user
  async startUserTrial(userId: string): Promise<string> {
    const { data, error } = await this.ensureSupabase()
      .rpc('start_user_trial', { user_id_param: userId });

    if (error) {
      console.error('Error starting trial (falling back to no-op):', error);
      // return a pseudo id to signal success without blocking
      return 'trial-started-fallback';
    }

    return data;
  }

  // Get user's current subscription
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    const { data, error } = await this.ensureSupabase()
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans (
          name,
          features,
          max_awy_connections,
          ai_chat_limit,
          priority_support
        )
      `)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No subscription found
      }
      console.error('Error fetching user subscription:', error);
      throw new Error('Failed to fetch subscription');
    }

    return data;
  }

  // Check if user's trial has expired
  async isTrialExpired(userId: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);
    
    if (!subscription || subscription.status !== 'trial') {
      return false;
    }

    if (!subscription.trial_end_date) {
      return false;
    }

    return new Date(subscription.trial_end_date) < new Date();
  }

  // Get days remaining in trial
  async getTrialDaysRemaining(userId: string): Promise<number> {
    const subscription = await this.getUserSubscription(userId);
    
    if (!subscription || subscription.status !== 'trial' || !subscription.trial_end_date) {
      return 0;
    }

    const trialEnd = new Date(subscription.trial_end_date);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }

  // Update subscription status (typically called by webhooks)
  async updateSubscriptionStatus(
    userId: string, 
    status: UserSubscription['status'],
    stripeSubscriptionId?: string,
    currentPeriodEnd?: Date
  ): Promise<void> {
    const updateData: Partial<UserSubscription> = {
      status,
      updated_at: new Date().toISOString()
    };

    if (stripeSubscriptionId) {
      updateData.stripe_subscription_id = stripeSubscriptionId;
    }

    if (currentPeriodEnd) {
      updateData.current_period_end = currentPeriodEnd.toISOString();
    }

    const { error } = await this.ensureSupabase()
      .from('user_subscriptions')
      .update(updateData)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating subscription status:', error);
      throw new Error('Failed to update subscription status');
    }
  }

  // Cancel subscription at period end
  async cancelSubscription(userId: string): Promise<void> {
    const { error } = await this.ensureSupabase()
      .from('user_subscriptions')
      .update({
        cancel_at_period_end: true,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error cancelling subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  // Reactivate cancelled subscription
  async reactivateSubscription(userId: string): Promise<void> {
    const { error } = await this.ensureSupabase()
      .from('user_subscriptions')
      .update({
        cancel_at_period_end: false,
        cancelled_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error reactivating subscription:', error);
      throw new Error('Failed to reactivate subscription');
    }
  }

  // Track feature usage
  async trackUsage(
    userId: string, 
    featureType: string, 
    usageCount: number = 1,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Try to update existing usage record
    const { data: existingUsage } = await this.ensureSupabase()
      .from('usage_tracking')
      .select('id, usage_count')
      .eq('user_id', userId)
      .eq('feature_type', featureType)
      .eq('period_start', periodStart.toISOString())
      .single();

    if (existingUsage) {
      // Update existing record
      const { error } = await this.ensureSupabase()
        .from('usage_tracking')
        .update({
          usage_count: existingUsage.usage_count + usageCount,
          metadata,
          updated_at: now.toISOString()
        })
        .eq('id', existingUsage.id);

      if (error) {
        console.error('Error updating usage tracking:', error);
      }
    } else {
      // Create new record
      const { error } = await this.ensureSupabase()
        .from('usage_tracking')
        .insert({
          user_id: userId,
          feature_type: featureType,
          usage_count: usageCount,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          metadata
        });

      if (error) {
        console.error('Error creating usage tracking:', error);
      }
    }
  }

  // Get user's usage for current period
  async getUserUsage(userId: string, featureType?: string): Promise<any[]> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let query = this.ensureSupabase()
      .from('usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('period_start', periodStart.toISOString());

    if (featureType) {
      query = query.eq('feature_type', featureType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching usage data:', error);
      return [];
    }

    return data || [];
  }
}

// Singleton instances
export const subscriptionService = new SubscriptionService();
