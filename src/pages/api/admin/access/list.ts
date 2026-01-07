import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminAccess } from '@/lib/access/verify';

/**
 * Admin API: List Access Allowlist
 * 
 * GET /api/admin/access/list
 * 
 * Returns all entries in access_allowlist table
 * Requires: Admin role
 * Uses: Service-role key to bypass RLS
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. VERIFY ADMIN ACCESS
    const { isAdmin, email } = await verifyAdminAccess(req, res);
    
    if (!isAdmin) {
      console.log('[ADMIN API] Access denied for:', email);
      return res.status(403).json({ 
        error: 'Forbidden - admin access required' 
      });
    }

    // 2. GET SERVICE-ROLE CLIENT
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

    // 3. FETCH ALL ALLOWLIST ENTRIES
    const { data, error } = await supabaseAdmin
      .from('access_allowlist')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[ADMIN API] Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch allowlist' });
    }

    console.log(`[ADMIN API] Listed ${data.length} allowlist entries for admin: ${email}`);

    // 4. RETURN DATA
    return res.status(200).json({
      entries: data,
      total: data.length,
    });

  } catch (error: any) {
    console.error('[ADMIN API] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
