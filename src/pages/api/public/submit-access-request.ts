import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

// Use Service Role for public submission to bypass RLS checks internally (or we can use ANON if RLS allows INSERT)
// Using Service Role allows us to run rate-limit checks securely without exposing reading capability to public
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, name, cohort, message, expected_term, college, website } = req.body;

  // 1. HONEYPOT CHECK
  if (website) {
    // If hidden 'website' field is filled, silently reject (spam bot)
    console.warn(`Honeypot triggered by ${req.headers['x-forwarded-for'] || 'unknown'}`);
    return res.status(200).json({ success: true }); // Fake success to confuse bots
  }

  if (!email || !name || !cohort) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // 2. RATE LIMITING (Basic IP Hash)
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  const ipHash = createHash('sha256').update(ip).digest('hex');

  // Check recent requests from this IP (e.g., max 5 per hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  const { count, error: limitError } = await supabaseAdmin
    .from('access_requests')
    .select('*', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('created_at', oneHourAgo);

  if ((count || 0) >= 5) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  // 3. DEDUPLICATION (Check Pending)
  const normalizedEmail = email.trim().toLowerCase();
  
  const { data: existing } = await supabaseAdmin
    .from('access_requests')
    .select('id')
    .eq('email', normalizedEmail)
    .eq('request_status', 'pending')
    .single();

  if (existing) {
    return res.status(409).json({ error: 'A pending request for this email already exists.' });
  }

  // 4. INSERT REQUEST
  const { error: insertError } = await supabaseAdmin
    .from('access_requests')
    .insert({
      email: normalizedEmail,
      name: name.trim(),
      cohort,
      message: message ? message.trim() : null,
      expected_term,
      college,
      ip_hash: ipHash,
      source: 'web',
      request_status: 'pending'
    });

  if (insertError) {
    console.error('Submission Error:', insertError);
    return res.status(500).json({ error: 'Failed to submit request' });
  }

  // Success
  return res.status(200).json({ success: true });
}
