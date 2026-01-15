// src/pages/api/awy/call/respond.ts
// Respond to incoming call - accept or decline

import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get authenticated user
  const supabaseUser = createServerSupabaseClient({ req, res });
  const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { callId, action } = req.body;

  if (!callId || !action) {
    return res.status(400).json({ error: 'Missing callId or action' });
  }

  if (!['accept', 'decline'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action. Must be "accept" or "decline"' });
  }

  const adminClient = getSupabaseAdmin();
  if (!adminClient) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  try {
    // Get the call and verify user is the loved one
    const { data: call, error: fetchError } = await adminClient
      .from('awy_calls')
      .select('*')
      .eq('id', callId)
      .single();

    if (fetchError || !call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    // Only loved one can respond
    if (call.loved_one_id !== user.id) {
      return res.status(403).json({ error: 'Only the called party can respond' });
    }

    // Only respond to ringing calls
    if (call.status !== 'ringing') {
      return res.status(400).json({ error: `Call is not ringing (status: ${call.status})` });
    }

    // Update call status
    const updateData: any = {};
    
    if (action === 'accept') {
      updateData.status = 'accepted';
      updateData.accepted_at = new Date().toISOString();
    } else {
      updateData.status = 'declined';
      updateData.ended_at = new Date().toISOString();
    }

    const { error: updateError } = await adminClient
      .from('awy_calls')
      .update(updateData)
      .eq('id', callId);

    if (updateError) throw updateError;

    return res.status(200).json({
      success: true,
      status: updateData.status,
      roomUrl: action === 'accept' ? call.room_url : null
    });

  } catch (error: any) {
    console.error('[AWY Call] Respond error:', error);
    return res.status(500).json({ error: error.message || 'Failed to respond to call' });
  }
}
