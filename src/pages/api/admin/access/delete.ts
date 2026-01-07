import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminAccess } from '@/lib/access/verify';

/**
 * Admin API: Block Access Allowlist Entry
 * 
 * POST /api/admin/access/block
 * Body: { email }
 * 
 * Sets status='blocked' for an entry
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
      console.log('[ADMIN BLOCK] Access denied for:', adminEmail);
      return res.status(403).json({ error: 'Forbidden - admin access required' });
    }

    // 2. VALIDATE INPUT
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' });
    }

    const emailLower = email.toLowerCase().trim();

    // Prevent blocking self
    if (emailLower === adminEmail?.toLowerCase()) {
      return res.status(400).json({ error: 'Cannot block your own account' });
    }

    // 3. GET SERVICE-ROLE CLIENT
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

    // 4. UPDATE STATUS TO BLOCKED
    const { data, error } = await supabaseAdmin
      .from('access_allowlist')
      .update({
        status: 'blocked',
        updated_at: new Date().toISOString(),
      })
      .eq('email', emailLower)
      .select()
      .single();

    if (error) {
      console.error('[ADMIN BLOCK] Database error:', error);
      return res.status(500).json({ error: 'Failed to block entry' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    console.log(`[ADMIN BLOCK] ${adminEmail} blocked: ${emailLower}`);

    // 5. RETURN DATA
    return res.status(200).json({
      ok: true,
      entry: data,
    });

  } catch (error: any) {
    console.error('[ADMIN BLOCK] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
