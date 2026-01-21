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

    const { transcriptId, pinned } = req.body;

    if (!transcriptId) {
      return res.status(400).json({ ok: false, error: 'transcriptId_required' });
    }

    const { data: journal, error: updateError } = await supabase
      .from('voice_journals')
      .update({ 
        is_pinned: !!pinned, 
        pinned_at: pinned ? new Date().toISOString() : null,
        updated_at: new Date().toISOString() 
      })
      .eq('id', transcriptId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) throw updateError;
    if (!journal) return res.status(404).json({ ok: false, error: 'transcript_not_found' });

    return res.status(200).json({ ok: true, transcript: journal });

  } catch (err: any) {
    console.error('[transcripts/pin] Error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
