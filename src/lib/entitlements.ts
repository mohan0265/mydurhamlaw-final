import { User } from "@supabase/supabase-js";

export interface UserProfile {
  role?: "user" | "trial" | "paid" | "demo" | "admin";
  demo_expires_at?: string;
  is_disabled?: boolean;
  password_locked?: boolean;
  grace_until?: string | null;
  subscription_status?: string | null;
  [key: string]: any;
}

export interface Entitlements {
  isDemo: boolean;
  isAdmin: boolean;
  hasFullAccess: boolean; // Bypasses paywall
  canUseTrialFeatures: boolean;
  isAccessDisabled: boolean;
  canChangePassword: boolean;
}

export function getEntitlements(profile: UserProfile | null): Entitlements {
  if (!profile) {
    return {
      isDemo: false,
      isAdmin: false,
      hasFullAccess: false,
      canUseTrialFeatures: false,
      isAccessDisabled: false,
      canChangePassword: false,
    };
  }

  // Check disability first
  const isDisabled = !!profile.is_disabled;

  // Check demo expiration
  const isDemoExpired =
    profile.role === "demo" && profile.demo_expires_at
      ? new Date(profile.demo_expires_at) < new Date()
      : false;

  const isAccessDisabled = isDisabled || isDemoExpired;

  if (isAccessDisabled) {
    return {
      isDemo: false, // Effectively no access
      isAdmin: false,
      hasFullAccess: false,
      canUseTrialFeatures: false,
      isAccessDisabled: true,
      canChangePassword: false,
    };
  }

  const role = profile.role || "user";
  const isDemo = role === "demo";
  const isAdmin = role === "admin";
  const isPaid = role === "paid";

  // Subscription Status Check
  const subStatus = profile.subscription_status;
  const graceUntil = profile.grace_until ? new Date(profile.grace_until) : null;
  const isGraceActive = graceUntil ? graceUntil > new Date() : false;

  // Full Access if:
  // 1. Admin or Demo or Paid role
  // 2. Active subscription
  // 3. Past Due but within Grace Period
  const isActiveSub = ["active", "trialing"].includes(subStatus || "");
  const isPastDueGrace = subStatus === "past_due" && isGraceActive;

  const hasFullAccess =
    isAdmin || isDemo || isPaid || isActiveSub || isPastDueGrace;

  // Trial logic can be expanded here based on existing logic if needed
  // For now, assume trial access is default for 'trial' role or 'user' (if trial not expired)
  // But strict interpretation: 'trial' role has trial features.
  const canUseTrialFeatures = role === "trial" || hasFullAccess;
  const canChangePassword = !(profile.password_locked || isDemo);

  return {
    isDemo,
    isAdmin,
    hasFullAccess,
    canUseTrialFeatures,
    isAccessDisabled,
    canChangePassword,
  };
}
