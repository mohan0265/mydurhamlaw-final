import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';

// This endpoint should be called AFTER successful Google Auth on the LNAT signup page
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // FEATURE FLAG: LNAT Launch Control
  const isLnatLaunchEnabled = process.env.NEXT_PUBLIC_LNAT_LAUNCH_ENABLED === 'true';
  
  if (!isLnatLaunchEnabled) {
      return res.status(403).json({ 
          message: 'LNAT Mentor is currently in waitlist mode. Access will open soon.' 
      });
  }

  if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const supabase = createPagesServerClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check if entitlement already exists
  const { data: existing, error: fetchError } = await supabase
    .from('user_entitlements')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('product', 'LNAT')
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "No Data Found"
      console.error('Error checking LNAT entitlement:', fetchError);
      return res.status(500).json({ error: fetchError.message });
  }

  // If exists and is active/expired, we might just return it. 
  // For now, if it exists, we just return success. 
  // If it was cancelled or expired, we might want to logic to reactivate or user goes to pricing.
  // For this MVP "Second Door", we assume new signups or re-signups get a trial if none exists.
  
  if (existing) {
      if (existing.status === 'ACTIVE') {
          return res.status(200).json({ message: 'Already active', entitlement: existing });
      }
      // If expired, we might redirect to payment, but for MVP let's just return it
      return res.status(200).json({ message: 'Exists', entitlement: existing });
  }

  // Create new TRIAL entitlement
  // Expires in 14 days
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14);

  const { data: newEntitlement, error: insertError } = await supabase
    .from('user_entitlements')
    .insert({
        user_id: session.user.id,
        product: 'LNAT',
        tier: 'TRIAL',
        status: 'ACTIVE',
        expires_at: expiresAt.toISOString(),
        features: { 
            lnat_enabled: true, 
            durham_enabled: false, 
            voice_enabled: false // Text-first MVP
        }
    })
    .select()
    .single();

  if (insertError) {
      console.error('Error creating LNAT entitlement:', insertError);
      return res.status(500).json({ error: insertError.message });
  }

  return res.status(201).json({ message: 'LNAT Entitlement Created', entitlement: newEntitlement });
}
