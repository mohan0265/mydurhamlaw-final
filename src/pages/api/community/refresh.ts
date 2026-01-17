// API Route: POST /api/community/refresh
// Purpose: Manually refresh community events cache

import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';

const SINGLETON_ID = '00000000-0000-0000-0000-000000000002';

// Static community highlights (can be replaced with dynamic source later)
function getCommunityHighlights() {
  return [
    {
      title: 'Durham Law Society Weekly Meetup',
      category: 'Society',
      date_range: 'Thursdays 6-8PM',
      location: 'Law Library',
      short_desc: 'Weekly networking and study group for law students',
    },
    {
      title: 'Pro Bono Legal Clinic',
      category: 'Pro Bono',
      date_range: 'Mondays & Wednesdays',
      location: 'Community Center',
      url: 'https://durham.probono.example',
      short_desc: 'Volunteer opportunity providing legal advice to local community',
    },
    {
      title: 'City Centre Coffee & Study Sessions',
      category: 'Student Life',
      date_range: 'Daily',
      location: 'Various cafes',
      short_desc: 'Informal study spots around Durham city centre',
    },
    {
      title: 'Weekend Hill Walks',
      category: 'Wellbeing',
      date_range: 'Saturdays 10AM',
      location: 'Cathedral',
      short_desc: 'Weekly walks for mental health and community building',
    },
  ];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return res.status(500).json({ error: 'Admin client not available' });
  }

  try {
    console.log('[community/refresh] Refreshing community cache...');
    const items = getCommunityHighlights();

    const { error: updateError } = await supabase
      .from('community_cache')
      .update({
        fetched_at: new Date().toISOString(),
        items,
      })
      .eq('id', SINGLETON_ID);

    if (updateError) {
      console.error('[community/refresh] Update error:', updateError);
      return res.status(500).json({ error: 'Failed to update cache' });
    }

    console.log('[community/refresh] Cache updated successfully');
    return res.status(200).json({ success: true, item_count: items.length });
  } catch (error) {
    console.error('[community/refresh] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
