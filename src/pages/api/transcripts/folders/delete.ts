import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  try {
    const supabase = createPagesServerClient({ req, res });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }

    const { folderId } = req.body;

    if (!folderId) {
      return res.status(400).json({ ok: false, error: 'folderId_required' });
    }

    // Verify ownership and delete
    // CASCADE handles subfolders and mapping items per DB schema
    const { error: deleteError } = await supabase
      .from('transcript_folders')
      .delete()
      .eq('id', folderId)
      .eq('user_id', user.id);

    if (deleteError) throw deleteError;

    return res.status(200).json({ ok: true });

  } catch (err: any) {
    console.error('[transcripts/folders/delete] Error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
