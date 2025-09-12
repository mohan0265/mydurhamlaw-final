
// Billing and subscription types
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly?: number;
  features: string[];
  max_awy_connections: number;
  ai_chat_limit: number; // -1 for unlimited
  priority_support: boolean;
  is_active: boolean;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'trial' | 'active' | 'cancelled' | 'expired' | 'past_due';
  trial_start_date?: string;
  trial_end_date?: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  cancelled_at?: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionInfo {
  subscription_id: string;
  plan_name: string;
  status: string;
  trial_end_date?: string;
  current_period_end: string;
  max_awy_connections: number;
  ai_chat_limit: number;
  priority_support: boolean;
  features: string[];
}

export interface UsageTracking {
  id: string;
  user_id: string;
  feature_type: string;
  usage_count: number;
  period_start: string;
  period_end: string;
  metadata: Record<string, any>;
}

export interface BillingEvent {
  id: string;
  user_id: string;
  event_type: string;
  event_data: Record<string, any>;
  stripe_event_id?: string;
  processed_at: string;
}

// AWY Enhanced Types
export interface AWYConnection {
  id: string;
  user_id: string;
  connected_user_id?: string;
  connection_email: string;
  relationship_label: string;
  display_name?: string;
  status: 'pending' | 'active' | 'blocked' | 'declined';
  permissions: {
    can_see_online_status: boolean;
    can_initiate_calls: boolean;
    can_see_calendar: boolean;
    can_receive_updates: boolean;
  };
  invitation_token?: string;
  invitation_expires_at?: string;
  connected_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AWYPresence {
  user_id: string;
  is_online: boolean;
  last_seen: string;
  current_activity?: string;
  mood?: string;
  location_context?: string;
  study_session_active: boolean;
  do_not_disturb: boolean;
  custom_status?: string;
  metadata: Record<string, any>;
  updated_at: string;
}

export interface AWYInteraction {
  id: string;
  from_user_id: string;
  to_user_id: string;
  connection_id: string;
  interaction_type: 'wave' | 'heart' | 'thinking_of_you' | 'call_request' | 'quick_message';
  message?: string;
  metadata: Record<string, any>;
  read_at?: string;
  created_at: string;
}

export interface AWYCallSession {
  id: string;
  connection_id: string;
  initiator_user_id: string;
  recipient_user_id: string;
  session_type: 'video' | 'voice' | 'screen_share';
  status: 'initiating' | 'ringing' | 'active' | 'ended' | 'declined' | 'missed';
  webrtc_session_id?: string;
  started_at: string;
  answered_at?: string;
  ended_at?: string;
  duration_seconds?: number;
  end_reason?: string;
  quality_rating?: number;
  metadata: Record<string, any>;
  created_at: string;
}

export interface AWYNotification {
  id: string;
  user_id: string;
  connection_id?: string;
  notification_type: string;
  title: string;
  message: string;
  action_url?: string;
  is_read: boolean;
  metadata: Record<string, any>;
  expires_at?: string;
  created_at: string;
}
