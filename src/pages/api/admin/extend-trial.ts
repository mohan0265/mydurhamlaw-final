import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseClient } from '@/lib/supabase/client';

// Simple in-memory rate limiter
const rateLimiter = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, limit: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = rateLimiter.get(ip);
  
  if (!record || now > record.resetAt) {
    rateLimiter.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (record.count >= limit) {
    return false;
  }
  
  record.count++;
  return true;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  try {
    // Verify admin session
    const adminSession = req.cookies.admin_session;
    if (!adminSession) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Verify admin credentials match
    const [username, password] = Buffer.from(adminSession, 'base64').toString().split(':');
    const validUsername = process.env.ADMIN_USERNAME || 'mohan0265';
    const validPassword = process.env.ADMIN_PASSWORD || 'Bhava2473#';

    if (username !== validUsername || password !== validPassword) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { user_id, add_days } = req.body;

    if (!user_id || typeof add_days !== 'number' || add_days <= 0) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    // Use SERVICE_ROLE_KEY for admin operations
    const supabase = getSupabaseClient();
    
    // Get current trial end date
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('trial_ends_at')
      .eq('id', user_id)
      .single();

    if (fetchError) {
      console.error('Error fetching profile:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }

    // Calculate new trial end (handle expired trials correctly)
    const now = new Date();
    const currentEnd = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : now;
    const baseDate = currentEnd > now ? currentEnd : now; // Use whichever is later
    const newEnd = new Date(baseDate.getTime() + add_days * 24 * 60 * 60 * 1000);

    // Update trial_ends_at
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ trial_ends_at: newEnd.toISOString() })
      .eq('id', user_id);

    if (updateError) {
      console.error('Error updating trial:', updateError);
      return res.status(500).json({ error: 'Failed to extend trial' });
    }

    return res.status(200).json({
      success: true,
      new_trial_end: newEnd.toISOString(),
      message: `Trial extended by ${add_days} days`
    });

  } catch (error) {
    console.error('Extend trial error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
