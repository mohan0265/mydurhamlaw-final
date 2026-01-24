import type { NextApiRequest, NextApiResponse } from 'next'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

/**
 * Update User Preferences API
 * POST /api/user/update-preferences
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const supabase = createPagesServerClient({ req, res })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { show_deadline_countdown } = req.body;

    if (typeof show_deadline_countdown !== 'boolean') {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        show_deadline_countdown,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('[update-preferences] Error updating preferences:', error);
      return res.status(500).json({ error: 'Failed to update preferences' });
    }

    return res.status(200).json({ success: true });

  } catch (err: any) {
    console.error('[update-preferences] Unexpected error:', err)
    return res.status(500).json({ error: err.message || 'Internal error' })
  }
}
