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

    const { transcriptPayload, folderId } = req.body;

    if (!transcriptPayload) {
      return res.status(400).json({ ok: false, error: 'transcriptPayload_required' });
    }

    const { 
      topic, 
      summary, 
      transcript, 
      content_text, 
      duration_seconds, 
      started_at, 
      ended_at 
    } = transcriptPayload;

    // 1. Resolve folderId (default to "Unsorted" if missing)
    let finalFolderId = folderId;
    if (!finalFolderId) {
      const { data: unsortedId, error: unsortedError } = await supabase
        .rpc('get_or_create_unsorted_folder', { p_user_id: user.id });
      
      if (unsortedError) {
        console.error('[transcripts/save] Unsorted folder error:', unsortedError);
        // Fallback: we'll just not assign a folder if RPC fails
      } else {
        finalFolderId = unsortedId;
      }
    } else {
      // Verify folder ownership
      const { data: folder, error: folderError } = await supabase
        .from('transcript_folders')
        .select('id')
        .eq('id', finalFolderId)
        .eq('user_id', user.id)
        .single();
      
      if (folderError || !folder) {
        return res.status(400).json({ ok: false, error: 'invalid_folder' });
      }
    }

    // 2. Save transcript to voice_journals
    const { data: journal, error: journalError } = await supabase
      .from('voice_journals')
      .insert({
        user_id: user.id,
        topic: topic || 'New Voice Session',
        summary: summary || '',
        transcript: transcript || [],
        content_text: content_text || '',
        duration_seconds: duration_seconds || 0,
        started_at: started_at || new Date().toISOString(),
        ended_at: ended_at || new Date().toISOString(),
      })
      .select()
      .single();

    if (journalError) throw journalError;

    // 3. Assign to folder if resolved
    if (finalFolderId) {
      const { error: assignError } = await supabase
        .from('transcript_folder_items')
        .insert({
          folder_id: finalFolderId,
          journal_id: journal.id,
          user_id: user.id
        });
      
      if (assignError) {
        console.error('[transcripts/save] Folder assignment error:', assignError);
        // We don't fail the whole request if assignment fails, but return the journal
      }
    }

    return res.status(200).json({ ok: true, transcript: journal });

  } catch (err: any) {
    console.error('[transcripts/save] Error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
