import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  try {
    const supabase = createPagesServerClient({ req, res });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }

    // Fetch all folders for the user
    const { data: folders, error: folderError } = await supabase
      .from('transcript_folders')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (folderError) throw folderError;

    // Build the tree structure
    const folderMap: Record<string, any> = {};
    const rootFolders: any[] = [];

    folders?.forEach(folder => {
      folderMap[folder.id] = { ...folder, children: [] };
    });

    folders?.forEach(folder => {
      if (folder.parent_id && folderMap[folder.parent_id]) {
        folderMap[folder.parent_id].children.push(folderMap[folder.id]);
      } else {
        rootFolders.push(folderMap[folder.id]);
      }
    });

    return res.status(200).json({ ok: true, tree: rootFolders });

  } catch (err: any) {
    console.error('[transcripts/folders/tree] Error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
