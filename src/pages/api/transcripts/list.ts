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

    let supabaseQuery = supabase
      .from('voice_journals')
      .select(`
        *,
        transcript_folder_items!left(folder_id)
      `, { count: 'exact' })
      .eq('user_id', user.id);

    // 1. Full-Text Search
    if (query) {
      // Use the search_tsv column with plainto_tsquery or websearch_to_tsquery
      supabaseQuery = supabaseQuery.textSearch('search_tsv', query as string, {
        type: 'websearch',
        config: 'english'
      });
    }

    // 2. Folder Filtering
    if (folderId) {
      supabaseQuery = supabaseQuery.eq('transcript_folder_items.folder_id', folderId);
    } else if (unfoldered === 'true') {
      supabaseQuery = supabaseQuery.is('transcript_folder_items.folder_id', null);
    }

    // 3. Pinned Filtering
    if (pinned === 'true') {
      supabaseQuery = supabaseQuery.eq('is_pinned', true);
    }

    // 4. Sorting
    if (query) {
      // If searching, we skip custom sort to allow rank-based sorting if desired, 
      // but usually users want recent first even in search results if not using rank.
      // Supabase's textSearch doesn't easily expose rank yet in simple select.
      supabaseQuery = supabaseQuery.order('created_at', { ascending: false });
    } else {
      switch (sort) {
        case 'oldest':
          supabaseQuery = supabaseQuery.order('created_at', { ascending: true });
          break;
        case 'title':
          supabaseQuery = supabaseQuery.order('topic', { ascending: true });
          break;
        case 'recent':
        default:
          // Pinned often come first in "All" view
          if (pinned !== 'true' && !folderId) {
             supabaseQuery = supabaseQuery.order('is_pinned', { ascending: false });
          }
          supabaseQuery = supabaseQuery.order('created_at', { ascending: false });
          break;
      }
    }

    // 5. Pagination
    supabaseQuery = supabaseQuery.range(from, to);

    const { data, count, error } = await supabaseQuery;

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
