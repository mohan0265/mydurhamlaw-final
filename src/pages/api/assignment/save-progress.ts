import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerUser } from '@/lib/api/serverAuth';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // AUTH: require logged-in user
  const { user } = await getServerUser(req, res);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { assignmentId, stage, data } = req.body;

  if (!assignmentId || !stage || !data) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Upsert stage progress
    const { error: saveError } = await supabase
      .from('assignment_stages')
      .upsert({
        assignment_id: assignmentId,
        user_id: user.id,
        current_stage: stage,
        stage_data: data,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'assignment_id,user_id',
      });

    if (saveError) {
      console.error('Auto-save error:', saveError);
      return res.status(500).json({ error: 'Failed to save progress' });
    }

    res.status(200).json({ success: true, savedAt: new Date().toISOString() });

  } catch (error: any) {
    console.error('Auto-save error:', error);
    res.status(500).json({ error: error.message || 'Failed to save progress' });
  }
}
