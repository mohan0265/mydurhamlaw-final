// src/pages/api/billing/validate-parent-link.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

/**
 * Validate Parent Payment Link
 * 
 * GET /api/billing/validate-parent-link?token=xxx
 * 
 * Returns: { valid: boolean, plan?: string, studentEmail?: string, expiresAt?: string }
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ 
      valid: false,
      error: 'Payment token is required' 
    });
  }

  try {
    const supabase = createPagesServerClient({ req, res });

    // Fetch payment link from database
    const { data, error } = await supabase
      .from('parent_payment_links')
      .select('*')
      .eq('payment_token', token)
      .single();

    if (error || !data) {
      return res.status(404).json({
        valid: false,
        error: 'Payment link not found'
      });
    }

    // Check if expired
    const expiresAt = new Date(data.expires_at);
    if (expiresAt < new Date()) {
      return res.status(410).json({
        valid: false,
        error: 'Payment link has expired'
      });
    }

    // Check if already used
    if (data.status === 'completed') {
      return res.status(410).json({
        valid: false,
        error: 'Payment link has already been used'
      });
    }

    // Valid link
    return res.status(200).json({
      valid: true,
      plan: data.plan,
      studentEmail: data.student_email,
      expiresAt: data.expires_at,
      userId: data.user_id
    });

  } catch (error: any) {
    console.error('[Validate Parent Link] Error:', error);
    return res.status(500).json({
      valid: false,
      error: 'Failed to validate payment link'
    });
  }
}
