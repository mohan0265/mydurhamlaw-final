// API Route: GET /api/news/latest
// Purpose: Return cached legal news items for Durmah intelligence

import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { LegalNewsCache, LegalNewsCacheItem } from '@/types/durmahPersistence';

const CACHE_STALE_HOURS = 24;
const SINGLETON_ID = '00000000-0000-0000-0000-000000000001';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createServerSupabaseClient({ req, res });

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 1. Fetch current cache
    const { data: cache, error: cacheError } = await supabase
      .from('legal_news_cache')
      .select('*')
      .eq('id', SINGLETON_ID)
      .single();

    if (cacheError || !cache) {
      return res.status(500).json({ error: 'Cache not found', items: [] });
    }

    // 2. Check if cache is stale
    const fetchedAt = new Date(cache.fetched_at);
    const now = new Date();
    const hoursSinceFetch = (now.getTime() - fetchedAt.getTime()) / (1000 * 60 * 60);
    const isStale = hoursSinceFetch > CACHE_STALE_HOURS;

    if (isStale) {
      console.log('[news/latest] Cache is stale (>24h), triggering background refresh');
      // Trigger background refresh (fire-and-forget)
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/news/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).catch((err) => console.error('[news/latest] Background refresh failed:', err));
    }

    // 3. Filter by module if requested
    const { module } = req.query;
    let items: LegalNewsCacheItem[] = cache.items || [];

    if (module && typeof module === 'string') {
      const keywords = module.toLowerCase().split(/[\s,]+/);
      items = items.filter((item) => {
        const searchText = `${item.title} ${item.source} ${(item.tags || []).join(' ')}`.toLowerCase();
        return keywords.some((kw) => searchText.includes(kw));
      });
    }

    // 4. Return top 10 most recent
    const recentItems = items
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
      .slice(0, 10);

    return res.status(200).json({
      items: recentItems,
      fetched_at: cache.fetched_at,
      is_stale: isStale,
    });
  } catch (error) {
    console.error('[news/latest] Error:', error);
    return res.status(500).json({ error: 'Internal server error', items: [] });
  }
}
