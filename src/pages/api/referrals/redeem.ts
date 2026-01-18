import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = createPagesServerClient({ req, res });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) return res.status(401).json({ error: 'Unauthorized' });

  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token required' });

  // 1. Verify Token & Match User Email
  const { data: referral, error: fetchError } = await supabase
    .from('referrals')
    .select('*')
    .eq('invite_token', token)
    .single();

  if (fetchError || !referral) {
      return res.status(404).json({ error: 'Invalid or expired invite.' });
  }

  // Check email match (normalized)
  const userEmailNorm = user.email.trim().toLowerCase();
  
  // NOTE: In strict mode, we force email match. 
  // If user signed up with Google (Durham), email should match.
  if (referral.referred_email_normalized !== userEmailNorm) {
      return res.status(403).json({ 
          error: 'Email mismatch. This invite was sent to ' + referral.referred_email 
      });
  }

  // Check if already redeemed
  if (referral.status !== 'invited') {
      return res.status(400).json({ error: 'Invite already redeemed or expired.' });
  }

  // 2. Mark Joined
  const now = new Date();
  
  const { error: updateError } = await supabase
      .from('referrals')
      .update({
          status: 'joined',
          joined_user_id: user.id,
          joined_at: now.toISOString(),
      })
      .eq('id', referral.id);

   if (updateError) {
       console.error('Redeem update error', updateError);
       return res.status(500).json({ error: 'Failed to redeem invite.' });
   }

   // 3. Activate 14-day Trial (via user_access_grants)
   const { error: grantError } = await supabase
       .from('user_access_grants')
       .insert({
           user_id: user.id,
           grant_type: 'pro_trial',
           source: 'referral',
           referral_id: referral.id,
           expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
           notes: 'Referral invite trial'
       });

   if (grantError) {
       console.error('Grant insert error', grantError);
       // Check for unique violation (already has trial) - safe to ignore or warn
       if (grantError.code !== '23505') {
           // Log real errors
       }
   }

   const trialUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // For response UI
   return res.status(200).json({ success: true, trial_until: trialUntil });
}
