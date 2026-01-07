import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { isAllowedDomain, isTrialValid } from './config';
import type { AccessDenialReason } from './config';

/**
 * Server-side access verification
 * 
 * Checks:
 * 1. Email domain is in ALLOWED_STUDENT_EMAIL_DOMAINS
 * 2. Email exists in access_allowlist with status='active'
 * 3. Trial is valid (trial_expires_at IS NULL OR > now())
 * 
 * Returns: { allowed: boolean, reason?: AccessDenialReason, email?: string }
 */

export interface AccessCheckResult {
  allowed: boolean;
  reason?: AccessDenialReason;
  email?: string;
  role?: 'student' | 'admin';
  trialExpiresAt?: string | null;
}

export async function verifyUserAccess(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<AccessCheckResult> {
  try {
    // 1. GET USER SESSION
    const supabase = createPagesServerClient({ req, res });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user || !user.email) {
      return { allowed: false, reason: 'not_in_allowlist' };
    }

    const email = user.email.toLowerCase().trim();

    // 2. CHECK ALLOWLIST FIRST (to determine role)
    // Note: We need to check allowlist BEFORE domain validation
    // because admins can have any email domain
    const { data: allowlistEntry, error: dbError } = await supabase
      .from('access_allowlist')
      .select('email, status, role, trial_expires_at')
      .eq('email', email)
      .maybeSingle();

    if (dbError) {
      console.error('[ACCESS CHECK] Database error:', dbError);
      return { allowed: false, reason: 'unknown', email };
    }

    if (!allowlistEntry) {
      console.log(`[ACCESS DENIED] Email not in allowlist: ${email}`);
      return { allowed: false, reason: 'not_in_allowlist', email };
    }

    // 3. CHECK DOMAIN (only for non-admin users)
    // Admins can have ANY email domain (e.g., mohan0265@gmail.com)
    if (allowlistEntry.role !== 'admin' && !isAllowedDomain(email)) {
      console.log(`[ACCESS DENIED] Domain not allowed for student: ${email}`);
      return { allowed: false, reason: 'domain_not_allowed', email };
    }

    // 4. CHECK STATUS
    if (allowlistEntry.status !== 'active') {
      console.log(`[ACCESS DENIED] Account blocked: ${email}`);
      return { allowed: false, reason: 'account_blocked', email };
    }

    // 5. CHECK TRIAL EXPIRY
    if (!isTrialValid(allowlistEntry.trial_expires_at)) {
      console.log(`[ACCESS DENIED] Trial expired: ${email}`);
      return { 
        allowed: false, 
        reason: 'trial_expired', 
        email,
        trialExpiresAt: allowlistEntry.trial_expires_at 
      };
    }

    // ALL CHECKS PASSED
    console.log(`[ACCESS GRANTED] ${email} (${allowlistEntry.role})`);
    return {
      allowed: true,
      email,
      role: allowlistEntry.role as 'student' | 'admin',
      trialExpiresAt: allowlistEntry.trial_expires_at,
    };

  } catch (error: any) {
    console.error('[ACCESS CHECK] Unexpected error:', error);
    return { allowed: false, reason: 'unknown' };
  }
}

/**
 * Verify user is admin
 * Use in admin route guards
 */
export async function verifyAdminAccess(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<{ isAdmin: boolean; email?: string }> {
  const result = await verifyUserAccess(req, res);
  
  if (!result.allowed) {
    return { isAdmin: false };
  }

  const isAdmin = result.role === 'admin';
  
  if (!isAdmin) {
    console.log(`[ADMIN ACCESS DENIED] User is not admin: ${result.email}`);
  }

  return { isAdmin, email: result.email };
}
