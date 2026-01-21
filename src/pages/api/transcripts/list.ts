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

    const { 
      folderId, 
      query, 
      pinned, 
      unfoldered, 
      page = '1', 
      pageSize = '20', 
      sort = 'recent' 
    } = req.query;

    const p = parseInt(page as string) || 1;
    const ps = parseInt(pageSize as string) || 20;
    const from = (p - 1) * ps;
    const to = from + ps - 1;

    // 0. Handle Recursive Folders if folderId is provided
    let targetFolderIds: string[] = [];
    if (folderId && folderId !== 'all' && folderId !== 'pinned') {
      const { data: descendantData } = await supabase.rpc('get_folder_descendants', { p_folder_id: folderId });
      if (descendantData) {
        targetFolderIds = descendantData.map((d: any) => d.folder_id);
      } else {
        targetFolderIds = [folderId as string];
      }
    }

    const selectStr = folderId && folderId !== 'all' && folderId !== 'pinned'
      ? `*, transcript_folder_items!inner(folder_id)` 
      : `*, transcript_folder_items!left(folder_id)`;

    const buildQuery = (isFallback = false) => {
      let q = supabase
        .from('voice_journals')
        .select(selectStr, { count: 'exact' })
        .eq('user_id', user.id);

      // 1. Search Logic
      if (query) {
        if (!isFallback) {
          q = q.textSearch('search_tsv', query as string, {
            type: 'websearch',
            config: 'english'
          });
        } else {
          // Fallback to ilike if TSV search yields nothing
          q = q.or(`topic.ilike.%${query}%,summary.ilike.%${query}%,content_text.ilike.%${query}%`);
        }
      }

      // 2. Folder Filtering
      if (folderId && folderId !== 'all' && folderId !== 'pinned') {
        q = q.in('transcript_folder_items.folder_id', targetFolderIds);
      } else if (unfoldered === 'true') {
        q = q.is('transcript_folder_items.folder_id', null);
      }

      // 3. Pinned Filtering
      if (pinned === 'true') {
        q = q.eq('is_pinned', true);
      }

      // 4. Sorting
      if (query && !isFallback) {
        q = q.order('created_at', { ascending: false });
      } else {
        switch (sort) {
          case 'oldest':
            q = q.order('created_at', { ascending: true });
            break;
          case 'title':
            q = q.order('topic', { ascending: true });
            break;
          case 'recent':
          default:
            if (pinned !== 'true' && (!folderId || folderId === 'all')) {
               q = q.order('is_pinned', { ascending: false });
            }
            q = q.order('created_at', { ascending: false });
            break;
        }
      }

      // 5. Pagination
      q = q.range(from, to);
      return q;
    };

    let { data, count, error } = await buildQuery(false);

    // Phase B — Fallback Hardening
    if (!error && query && (!data || data.length === 0)) {
      console.log('[transcripts/list] TSV search yielded no results, trying ilike fallback...');
      const fallbackResult = await buildQuery(true);
      if (!fallbackResult.error) {
        data = fallbackResult.data;
        count = fallbackResult.count;
      }
    }

    if (error) throw error;

    return res.status(200).json({ 
      ok: true, 
      transcripts: data, 
      total: count,
      page: p,
      pageSize: ps
    });

  } catch (err: any) {
    console.error('[transcripts/list] Error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
