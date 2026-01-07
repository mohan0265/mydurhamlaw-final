import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

/**
 * Durmah Tool: Get News Headlines
 * 
 * Allows Durmah to fetch recent legal news headlines.
 * Used for answering queries like:
 * - "Any legal news this week?"
 * - "What's new in Contract Law?"
 * 
 * Authentication: Required (uses Supabase session)
 * 
 * TODO: Connect to actual RSS feed or news API
 * For now returns demo data to enable testing
 */

interface Headline {
  title: string;
  source: string;
  published: string;
  url: string;
  tags: string[];
  summary?: string;
}

interface ToolResponse {
  headlines: Headline[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ToolResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. AUTH CHECK
    const supabase = createPagesServerClient({ req, res });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('[news-headlines] Auth error:', authError);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 2. PARSE PARAMS
    const { limit = '5', topic } = req.query;
    const maxHeadlines = parseInt(limit as string) || 5;
    const topicFilter = topic as string | undefined;

    console.log(`[news-headlines] Fetching ${maxHeadlines} headlines, topic=${topicFilter || 'all'}`);

    // 3. FETCH NEWS (TODO: Replace with real RSS/news API)
    // For now, return demo headlines for testing
    const allHeadlines: Headline[] = [
      {
        title: "Supreme Court Rules on Contract Formation in Digital Age",
        source: "The Law Society Gazette",
        published: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        url: "https://www.lawgazette.co.uk/news/contract-formation-ruling",
        tags: ["contract", "supreme-court", "digital"],
        summary: "Landmark ruling clarifies when online agreements become binding."
      },
      {
        title: "New Tort Liability Framework for AI Systems",
        source: "Solicitors Journal",
        published: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        url: "https://www.solicitorsjournal.com/tort-ai-liability",
        tags: ["tort", "ai", "liability"],
        summary: "Courts establish new principles for determining liability in AI-related harm."
      },
      {
        title: "EU Law Post-Brexit: Key Changes for UK Students",
        source: "Legal Futures",
        published: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        url: "https://www.legalfutures.co.uk/eu-law-brexit-changes",
        tags: ["eu-law", "brexit", "education"],
        summary: "Guide to understanding EU law in the post-Brexit curriculum."
      },
      {
        title: "Durham Law School Launches New Clinical Programme",
        source: "Durham University News",
        published: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
        url: "https://www.durham.ac.uk/news/clinical-law-programme",
        tags: ["durham", "clinical-law", "education"],
        summary: "Students can now gain practical experience through new pro bono clinic."
      },
      {
        title: "Criminal Law Reform: Sentencing Guidelines Updated",
        source: "The Times Law",
        published: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
        url: "https://www.thetimes.co.uk/law/sentencing-reform",
        tags: ["criminal", "sentencing", "reform"],
        summary: "New guidelines aim for consistency in sentencing across courts."
      }
    ];

    // 4. FILTER BY TOPIC if provided
    let filteredHeadlines = allHeadlines;
    if (topicFilter) {
      const topicLower = topicFilter.toLowerCase();
      filteredHeadlines = allHeadlines.filter(h => 
        h.tags.some(tag => tag.includes(topicLower)) ||
        h.title.toLowerCase().includes(topicLower) ||
        h.summary?.toLowerCase().includes(topicLower)
      );
    }

    // 5. LIMIT RESULTS
    const headlines = filteredHeadlines.slice(0, maxHeadlines);

    console.log(`[news-headlines] Returning ${headlines.length} headlines`);

    // 6. RETURN RESPONSE
    return res.status(200).json({ headlines });

  } catch (error: any) {
    console.error('[news-headlines] Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}
