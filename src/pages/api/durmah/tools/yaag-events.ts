import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { buildYAAGEvents } from '@/lib/calendar/yaagEventsBuilder';

/**
 * Durmah Tool: Get YAAG Events
 * 
 * Allows Durmah to fetch student's schedule for any date range.
 * Used for answering queries like:
 * - "What's on Wed 28 Jan?"
 * - "What do I have next week?"
 * 
 * Authentication: Required (uses Supabase session)
 * RLS: Enforced via buildYAAGEvents (filters by user_id)
 */

interface ToolResponse {
  events: any[];
  rangeStart: string;
  rangeEnd: string;
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
      console.error('[yaag-events] Auth error:', authError);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 2. VALIDATE PARAMS
    const { startISO, endISO } = req.query;
    
    if (!startISO || typeof startISO !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid startISO (YYYY-MM-DD required)' });
    }
    
    if (!endISO || typeof endISO !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid endISO (YYYY-MM-DD required)' });
    }

    // Basic date format validation
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startISO) || !dateRegex.test(endISO)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    console.log(`[yaag-events] Fetching events for user ${user.id} from ${startISO} to ${endISO}`);

    // 3. GET USER'S YEAR GROUP (for Plan events)
    const { data: profile } = await supabase
      .from('profiles')
      .select('year_of_study, year_group')
      .eq('id', user.id)
      .maybeSingle();

    const yearKey = profile?.year_of_study || profile?.year_group || 'year1';

    // 4. FETCH EVENTS using shared builder
    const events = await buildYAAGEvents({
      req,
      res,
      yearKey,
      fromDate: startISO,
      toDate: endISO,
      userId: user.id,
    });

    console.log(`[yaag-events] Found ${events.length} events for range ${startISO} to ${endISO}`);

    // 5. RETURN RESPONSE
    return res.status(200).json({
      events,
      rangeStart: startISO,
      rangeEnd: endISO,
    });

  } catch (error: any) {
    console.error('[yaag-events] Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}
