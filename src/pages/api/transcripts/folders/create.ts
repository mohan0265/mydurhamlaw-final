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

    const { name, parentId = null, color = '#3B82F6' } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ ok: false, error: 'name_required' });
    }

    // If parentId provided, verify ownership
    if (parentId) {
      const { data: parentFolder, error: parentError } = await supabase
        .from('transcript_folders')
        .select('id')
        .eq('id', parentId)
        .eq('user_id', user.id)
        .single();
      
      if (parentError || !parentFolder) {
        return res.status(400).json({ ok: false, error: 'invalid_parent_folder' });
      }
    }

    const { data: folder, error: createError } = await supabase
      .from('transcript_folders')
      .insert({
        user_id: user.id,
        parent_id: parentId,
        name: name.trim(),
        color
      })
      .select()
      .single();

    if (createError) throw createError;

    return res.status(200).json({ ok: true, folder });

  } catch (err: any) {
    console.error('[transcripts/folders/create] Error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
