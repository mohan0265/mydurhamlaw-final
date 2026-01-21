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

    const { folderId, name } = req.body;

    if (!folderId || !name?.trim()) {
      return res.status(400).json({ ok: false, error: 'folderId_and_name_required' });
    }

    // Verify ownership and update
    const { data: folder, error: updateError } = await supabase
      .from('transcript_folders')
      .update({ name: name.trim(), updated_at: new Date().toISOString() })
      .eq('id', folderId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) throw updateError;
    if (!folder) return res.status(404).json({ ok: false, error: 'folder_not_found' });

    return res.status(200).json({ ok: true, folder });

  } catch (err: any) {
    console.error('[transcripts/folders/rename] Error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
