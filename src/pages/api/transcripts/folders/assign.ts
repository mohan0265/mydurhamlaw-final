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

    const { transcriptId, folderId, assigned } = req.body;

    if (!transcriptId || !folderId) {
      return res.status(400).json({ ok: false, error: 'transcriptId_and_folderId_required' });
    }

    // Verify ownership of folder
    const { data: folder, error: folderError } = await supabase
      .from('transcript_folders')
      .select('id')
      .eq('id', folderId)
      .eq('user_id', user.id)
      .single();

    if (folderError || !folder) {
      return res.status(400).json({ ok: false, error: 'invalid_folder' });
    }

    // Verify ownership of transcript
    const { data: journal, error: journalError } = await supabase
      .from('voice_journals')
      .select('id')
      .eq('id', transcriptId)
      .eq('user_id', user.id)
      .single();
    
    if (journalError || !journal) {
      return res.status(400).json({ ok: false, error: 'invalid_transcript' });
    }

    if (assigned) {
      // Upsert mapping
      const { error: upsertError } = await supabase
        .from('transcript_folder_items')
        .upsert({ 
          folder_id: folderId, 
          journal_id: transcriptId,
          user_id: user.id 
        }, { onConflict: 'folder_id,journal_id' });
      
      if (upsertError) throw upsertError;
    } else {
      // Remove mapping
      const { error: deleteError } = await supabase
        .from('transcript_folder_items')
        .delete()
        .eq('folder_id', folderId)
        .eq('journal_id', transcriptId)
        .eq('user_id', user.id);
      
      if (deleteError) throw deleteError;
    }

    return res.status(200).json({ ok: true });

  } catch (err: any) {
    console.error('[transcripts/folders/assign] Error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
