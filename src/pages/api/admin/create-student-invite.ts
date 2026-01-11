import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

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
    return res.status(429).json({ error: 'Too many requests - please wait before creating another student' });
  }

  try {
    // Verify admin session
    const adminSession = req.cookies.admin_session;
    if (!adminSession) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Verify admin credentials
    const [username, password] = Buffer.from(adminSession, 'base64').toString().split(':');
    const validUsername = process.env.ADMIN_USERNAME || 'mohan0265';
    const validPassword = process.env.ADMIN_PASSWORD || 'Bhava2473#';

    if (username !== validUsername || password !== validPassword) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { email, year_group, trial_days = 14 } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    if (trial_days <= 0 || trial_days > 365) {
      return res.status(400).json({ error: 'Trial days must be between 1 and 365' });
    }

    // Use SERVICE_ROLE_KEY for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!serviceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Create user via Supabase Admin API (NO email_confirm: true)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: false, // Let invite link handle verification
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return res.status(500).json({ error: authError.message || 'Failed to create user' });
    }

    // Set trial_ends_at
    const trialEnds = new Date();
    trialEnds.setDate(trialEnds.getDate() + trial_days);

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        trial_ends_at: trialEnds.toISOString(),
        year_group: year_group || 'year1',
        subscription_status: 'trial',
      })
      .eq('id', authData.user.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      // User created but profile update failed - log but continue
    }

    // Generate invite link (NOT recovery link)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email,
      options: {
        redirectTo: `${siteUrl}/auth/callback`
      }
    });

    if (linkError) {
      console.error('Error generating invite link:', linkError);
      return res.status(500).json({ error: 'User created but failed to generate invite link' });
    }

    return res.status(200).json({
      success: true,
      user_id: authData.user.id,
      email,
      invite_link: linkData.properties.action_link,
      trial_ends_at: trialEnds.toISOString(),
      message: 'Student created successfully. Copy the invite link and share it with the student.'
    });

  } catch (error) {
    console.error('Create student error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
