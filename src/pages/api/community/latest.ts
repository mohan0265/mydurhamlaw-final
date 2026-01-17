// API Route: GET /api/community/latest
// Purpose: Return cached community events/highlights for Durmah

import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

const SINGLETON_ID = '00000000-0000-0000-0000-000000000002';
const CACHE_STALE_HOURS = 24;

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
      .from('community_cache')
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
      console.log('[community/latest] Cache is stale (>24h), triggering background refresh');
      // Trigger background refresh
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/community/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).catch((err) => console.error('[community/latest] Background refresh failed:', err));
    }

    const items = cache.items || [];

    // 3. Return recent community items
    return res.status(200).json({
      items: items.slice(0, 10),
      fetched_at: cache.fetched_at,
      is_stale: isStale,
    });
  } catch (error) {
    console.error('[community/latest] Error:', error);
    return res.status(500).json({ error: 'Internal server error', items: [] });
  }
}
