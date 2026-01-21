import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = createPagesServerClient({ req, res });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { data, error } = await supabase
    .from('referrals')
    .select('referred_email, status, invited_at, joined_at')
    .eq('referrer_user_id', user.id)
    .order('invited_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  // Mask emails for privacy/security display
  const maskedDocs = data.map(ref => ({
      ...ref,
      referred_email: ref.referred_email ? maskEmail(ref.referred_email) : 'Unknown'
  }));

  return res.status(200).json({ referrals: maskedDocs });
}

function maskEmail(email: string) {
    const parts = email.split('@');
    if (parts.length < 2) return email;
    
    const local = parts[0] || '';
    const domain = parts[1];
    
    if (local.length <= 2) return `${local}***@${domain}`;
    return `${local.substring(0, 2)}***@${domain}`;
}
