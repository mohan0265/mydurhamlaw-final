import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { isAllowedDomain, calculateTrialExpiry } from '@/lib/access/config';

/**
 * Trial Access Request API
 * 
 * Public endpoint for Durham students to request trial access
 * 
 * Flow:
 * 1. Validate email domain (@durham.ac.uk only for students)
 * 2. Upsert to access_allowlist with 30-day trial
 * 3. Return success
 * 
 * Rate Limiting:
 * - Max 5 requests per IP per hour
 * - Max 3 requests per email per day
 */

// Simple in-memory rate limit store (production: use Redis or Supabase)
const ipRateLimit = new Map<string, { count: number; resetAt: number }>();
const emailRateLimit = new Map<string, { count: number; resetAt: number }>();

const IP_LIMIT = 5;
const IP_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const EMAIL_LIMIT = 3;
const EMAIL_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

function checkRateLimit(
  store: Map<string, { count: number; resetAt: number }>,
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = store.get(key);

  if (!record || now > record.resetAt) {
    // Reset or create new
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (record.count >= limit) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  record.count++;
  return { allowed: true };
}

function getClientIP(req: NextApiRequest): string {
  // Check various headers for real IP (Netlify/Vercel compatible)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
  }
  return req.headers['x-real-ip'] as string || 'unknown';
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, name } = req.body;

    // 1. VALIDATE INPUT
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ 
        error: 'Email is required',
        field: 'email'
      });
    }

    const emailLower = email.toLowerCase().trim();

    // 2. VALIDATE DOMAIN
    if (!isAllowedDomain(emailLower)) {
      console.log(`[TRIAL REQUEST DENIED] Invalid domain: ${emailLower}`);
      return res.status(400).json({
        error: 'Only Durham University students can request access. Please use your @durham.ac.uk email.',
        field: 'email'
      });
    }

    // 3. RATE LIMITING (IP)
    const clientIP = getClientIP(req);
    const ipCheck = checkRateLimit(ipRateLimit, clientIP, IP_LIMIT, IP_WINDOW_MS);
    if (!ipCheck.allowed) {
      console.log(`[TRIAL REQUEST] Rate limit exceeded for IP: ${clientIP}`);
      return res.status(429).json({
        error: `Too many requests. Please try again in ${ipCheck.retryAfter} seconds.`,
        retryAfter: ipCheck.retryAfter
      });
    }

    // 4. RATE LIMITING (Email)
    const emailCheck = checkRateLimit(emailRateLimit, emailLower, EMAIL_LIMIT, EMAIL_WINDOW_MS);
    if (!emailCheck.allowed) {
      console.log(`[TRIAL REQUEST] Rate limit exceeded for email: ${emailLower}`);
      return res.status(429).json({
        error: `This email has requested access too many times. Please try again in ${Math.ceil(emailCheck.retryAfter! / 3600)} hours.`,
        retryAfter: emailCheck.retryAfter
      });
    }

    // 5. CREATE SERVICE-ROLE CLIENT (bypass RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 6. UPSERT TO ALLOWLIST
    const trialExpiry = calculateTrialExpiry();
    
    const { data, error } = await supabaseAdmin
      .from('access_allowlist')
      .upsert({
        email: emailLower,
        status: 'active',
        role: 'student',
        trial_expires_at: trialExpiry.toISOString(),
        notes: `Trial requested${name ? ` by ${name}` : ''} on ${new Date().toISOString()}`,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'email',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('[TRIAL REQUEST] Database error:', error);
      return res.status(500).json({
        error: 'Failed to process request. Please try again.'
      });
    }

    console.log(`[TRIAL REQUEST] Approved: ${emailLower} (expires: ${trialExpiry.toISOString()})`);

    // 7. SUCCESS RESPONSE
    return res.status(200).json({
      ok: true,
      message: 'Trial access approved! You can now sign in with Google using your Durham email.',
      email: emailLower,
      trial_expires_at: trialExpiry.toISOString(),
      trial_days: Math.ceil((trialExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    });

  } catch (error: any) {
    console.error('[TRIAL REQUEST] Unexpected error:', error);
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
}
