// src/lib/billing/isProAccess.ts
export type AccessGrant = {
  grant_type: string;
  starts_at?: string | null;
  expires_at?: string | null;
  revoked_at?: string | null;
};

function isActiveGrant(grant: AccessGrant, now: Date) {
  if (grant.revoked_at) return false;

  const startsOk = !grant.starts_at || new Date(grant.starts_at) <= now;
  if (!startsOk) return false;

  // expires_at null => non-expiring grant (fine, but avoid for trials)
  const expiresOk = !grant.expires_at || new Date(grant.expires_at) > now;
  return expiresOk;
}

/**
 * Pro access = paid subscription (Stripe-driven) OR active pro_trial grant.
 * This is intentionally additive so it won’t collide with Stripe later.
 */
export function isProAccess(subscription: any | null, grants: AccessGrant[] | null, now = new Date()): boolean {
  // Stripe / subscription-driven access
  const status = String(subscription?.status || '').toLowerCase(); // 'active' | 'trial' | etc.
  const inPaidState = status === 'active' || status === 'trial';

  // Your API sometimes returns tier='free' fallback; SubscriptionInfo has plan_name.
  const planName = String(subscription?.plan_name ?? subscription?.planName ?? subscription?.tier ?? '').toLowerCase();

  // treat as paid/pro if in paid state AND not explicitly free
  const stripePro =
    inPaidState &&
    planName !== 'free' &&
    planName !== '' &&
    planName !== 'inactive';

  // Grant-driven access (referral pro trial)
  const proTrialGrant = (grants || []).some(
    (g) => String(g.grant_type).toLowerCase() === 'pro_trial' && isActiveGrant(g, now)
  );

  return stripePro || proTrialGrant;
}
