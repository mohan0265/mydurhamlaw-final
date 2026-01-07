import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyUserAccess } from '@/lib/access/verify';

/**
 * Access Verification Endpoint
 * 
 * Returns whether the current user is allowed to access the app
 * Used by:
 * - Auth callback (to block unauthorized signins)
 * - Protected page guards (getServerSideProps)
 * - Client-side checks (optional)
 * 
 * This is a convenience endpoint - prefer using verifyUserAccess() directly
 * in getServerSideProps for better performance
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await verifyUserAccess(req, res);
    
    if (!result.allowed) {
      return res.status(403).json({
        allowed: false,
        reason: result.reason,
        message: getErrorMessage(result.reason),
      });
    }

    return res.status(200).json({
      allowed: true,
      email: result.email,
      role: result.role,
      trial_expires_at: result.trialExpiresAt,
    });

  } catch (error: any) {
    console.error('[ACCESS VERIFY] Error:', error);
    return res.status(500).json({
      allowed: false,
      reason: 'unknown',
      message: 'An error occurred while verifying access',
    });
  }
}

function getErrorMessage(reason?: string): string {
  switch (reason) {
    case 'domain_not_allowed':
      return 'Only Durham University students can access this app';
    case 'not_in_allowlist':
      return 'Please request trial access first';
    case 'trial_expired':
      return 'Your trial period has expired';
    case 'account_blocked':
      return 'Your account has been restricted';
    default:
      return 'Access denied';
  }
}
