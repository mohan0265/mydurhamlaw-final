import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createServerSupabaseClient({ req, res });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { query, limit = 3 } = req.body;

  if (!query || query.trim().length < 3) {
    return res.status(400).json({ 
      error: 'Query must be at least 3 characters' 
    });
  }

  try {
    // Use Postgres full-text search on onboarding_docs
    // The GIN index we created enables fast FTS
    const { data: results, error } = await supabase
      .from('onboarding_docs')
      .select('id, title, slug, summary, content_markdown, category, keywords')
      .textSearch('fts', query, {
        type: 'websearch',
        config: 'english'
      })
      .eq('is_published', true)
      .order('display_order', { ascending: true })
      .limit(limit);

    if (error) throw error;

    // If FTS returns nothing, try keyword matching as fallback
    if (!results || results.length === 0) {
      const { data: fallbackResults, error: fallbackError } = await supabase
        .from('onboarding_docs')
        .select('id, title, slug, summary, content_markdown, category, keywords')
        .or(`title.ilike.%${query}%,keywords.cs.{${query}}`)
        .eq('is_published', true)
        .order('display_order', { ascending: true })
        .limit(limit);

      if (fallbackError) throw fallbackError;

      return res.status(200).json({
        results: fallbackResults || [],
        query,
        method: 'keyword_fallback'
      });
    }

    return res.status(200).json({
      results,
      query,
      method: 'full_text_search'
    });

  } catch (error: any) {
    console.error('Onboarding search error:', error);
    return res.status(500).json({ 
      error: 'Search failed',
      details: error.message
    });
  }
}
