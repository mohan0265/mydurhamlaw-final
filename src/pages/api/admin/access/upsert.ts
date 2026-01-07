import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminAccess } from '@/lib/access/verify';
import { isAllowedDomain } from '@/lib/access/config';

/**
 * Admin API: Upsert Access Allowlist Entry
 * 
 * POST /api/admin/access/upsert
 * Body: { email, role, status, trial_expires_at, notes }
 * 
 * Creates or updates an allowlist entry
 * Requires: Admin role
 * Uses: Service-role key to bypass RLS
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. VERIFY ADMIN ACCESS
    const { isAdmin, email: adminEmail } = await verifyAdminAccess(req, res);
    
    if (!isAdmin) {
      console.log('[ADMIN UPSERT] Access denied for:', adminEmail);
      return res.status(403).json({ error: 'Forbidden - admin access required' });
    }

    // 2. VALIDATE INPUT
    const { email, role, status, trial_expires_at, notes, trial_days } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' });
    }

    const emailLower = email.toLowerCase().trim();

    // Validate role
    if (role && !['student', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be student or admin' });
    }

    // Validate status
    if (status && !['active', 'blocked', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Validate domain (only for students)
    if (role === 'student' && !isAllowedDomain(emailLower)) {
      return res.status(400).json({
        error: 'Students must have @durham.ac.uk email. Admins can have any domain.',
      });
    }

    // 3. CALCULATE TRIAL EXPIRY if trial_days provided
    let calculatedExpiry = trial_expires_at;
    if (trial_days && typeof trial_days === 'number') {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + trial_days);
      calculatedExpiry = expiry.toISOString();
    }

    // 4. GET SERVICE-ROLE CLIENT
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

    // 5. UPSERT ENTRY
    const { data, error } = await supabaseAdmin
      .from('access_allowlist')
      .upsert({
        email: emailLower,
        role: role || 'student',
        status: status || 'active',
        trial_expires_at: calculatedExpiry || null,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'email',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('[ADMIN UPSERT] Database error:', error);
      return res.status(500).json({ error: 'Failed to upsert entry' });
    }

    console.log(`[ADMIN UPSERT] ${adminEmail} upserted: ${emailLower} (${data.role})`);

    // 6. RETURN DATA
    return res.status(200).json({
      ok: true,
      entry: data,
    });

  } catch (error: any) {
    console.error('[ADMIN UPSERT] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
