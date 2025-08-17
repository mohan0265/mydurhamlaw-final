import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user from session/auth
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    // Get user's primary year
    if (!supabase) {
      console.error('Supabase client is not available.');
      return res.status(500).json({ error: 'Database connection unavailable' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('primary_year')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Clear preview year cookie
    res.setHeader('Set-Cookie', 'preview_year=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');

    return res.status(200).json({
      success: true,
      activeYear: profile.primary_year,
      message: 'Cleared preview, reverted to primary year'
    });

  } catch (error) {
    console.error('Clear preview error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}