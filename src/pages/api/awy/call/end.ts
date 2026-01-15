// src/pages/api/awy/call/end.ts
// End an active call - either party can end

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

  const { callId } = req.body;

  if (!callId) {
    return res.status(400).json({ error: 'Missing callId' });
  }

  const adminClient = getSupabaseAdmin();
  if (!adminClient) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  try {
    // Get the call and verify user is a participant
    const { data: call, error: fetchError } = await adminClient
      .from('awy_calls')
      .select('*')
      .eq('id', callId)
      .single();

    if (fetchError || !call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    // Either party can end
    if (call.student_id !== user.id && call.loved_one_id !== user.id) {
      return res.status(403).json({ error: 'You are not a participant in this call' });
    }

    // Can only end ringing or accepted calls
    if (!['ringing', 'accepted'].includes(call.status)) {
      return res.status(400).json({ error: `Call already ended (status: ${call.status})` });
    }

    // Determine final status
    const newStatus = call.status === 'ringing' ? 'missed' : 'ended';

    const { error: updateError } = await adminClient
      .from('awy_calls')
      .update({
        status: newStatus,
        ended_at: new Date().toISOString()
      })
      .eq('id', callId);

    if (updateError) throw updateError;

    return res.status(200).json({
      success: true,
      status: newStatus
    });

  } catch (error: any) {
    console.error('[AWY Call] End error:', error);
    return res.status(500).json({ error: error.message || 'Failed to end call' });
  }
}
