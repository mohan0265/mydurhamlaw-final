import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Auth check (prevent abuse)
  const supabase = createServerSupabaseClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    // 2. Fetch the external URL (server-side)
    // We add a User-Agent to look like a browser, though login walls might still screen us.
    // The goal is just to get the <title> tag if possible.
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MyDurhamLaw/1.0; +https://mydurhamlaw.com)'
      }
    });

    if (!response.ok) {
        // If we get 403, it's likely a login page. 
        // We can't really do much without auth cookies.
        // We accept defeat here and return success=false.
        return res.status(200).json({ success: false, reason: `Status ${response.status}` });
    }

    const html = await response.text();

    // 3. Extract <title>
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    const pageTitle = titleMatch ? (titleMatch[1] || '').trim() : null;

    if (!pageTitle) {
      return res.status(200).json({ success: false, reason: 'No title tag found' });
    }

    // Success!
    return res.status(200).json({ 
      success: true, 
      title: pageTitle 
    });

  } catch (error: any) {
    console.warn('[Metadata Fetch] Error:', error.message);
    return res.status(200).json({ success: false, reason: error.message });
  }
}
