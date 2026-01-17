// API Route: POST /api/news/refresh
// Purpose: Manually refresh legal news cache (admin or server-triggered)

import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';

const SINGLETON_ID = '00000000-0000-0000-0000-000000000001';

// Helper to fetch and parse RSS news
async function fetchLegalNews() {
  try {
    // Call existing RSS endpoint to get news
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const response = await fetch(`${baseUrl}/api/rss-news`);
    
    if (!response.ok) {
      console.error('[news/refresh] RSS fetch failed:', response.status);
      return [];
    }

    const data = await response.json();
    
    // Transform RSS items to cache format
    const items = (data.rss?.items || []).map((item: any) => ({
      title: item.tittle || item.title || 'Untitled',
      source: item.category || item.source || 'Legal News',
      url: item.link || '',
      published_at: item.pubDate || new Date().toISOString(),
      tags: [item.category, item.source].filter(Boolean),
    }));

    return items;
  } catch (error) {
    console.error('[news/refresh] Fetch error:', error);
    return [];
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Use admin client for cache updates
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return res.status(500).json({ error: 'Admin client not available' });
  }

  try {
    console.log('[news/refresh] Fetching latest legal news...');
    const items = await fetchLegalNews();

    console.log(`[news/refresh] Fetched ${items.length} items, updating cache...`);

    // Update cache
    const { error: updateError } = await supabase
      .from('legal_news_cache')
      .update({
        fetched_at: new Date().toISOString(),
        items,
      })
      .eq('id', SINGLETON_ID);

    if (updateError) {
      console.error('[news/refresh] Update error:', updateError);
      return res.status(500).json({ error: 'Failed to update cache' });
    }

    console.log('[news/refresh] Cache updated successfully');
    return res.status(200).json({ success: true, item_count: items.length });
  } catch (error) {
    console.error('[news/refresh] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
