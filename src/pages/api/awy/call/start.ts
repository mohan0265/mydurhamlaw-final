// src/pages/api/awy/call/start.ts
// Start a video call - creates Daily room and awy_calls record

import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_DOMAIN = process.env.NEXT_PUBLIC_DAILY_DOMAIN || 'mydurhamlaw';

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

  const { lovedOneId } = req.body;

  if (!lovedOneId) {
    return res.status(400).json({ error: 'Missing lovedOneId' });
  }

  const adminClient = getSupabaseAdmin();
  if (!adminClient) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  try {
    // Verify connection exists - support BIDIRECTIONAL calling
    // Check if user is student calling loved one
    let { data: connection } = await adminClient
      .from('awy_connections')
      .select('id, status, student_id, loved_one_id')
      .eq('student_id', user.id)
      .eq('loved_one_id', lovedOneId)
      .in('status', ['granted', 'active', 'accepted'])
      .maybeSingle();

    let caller: 'student' | 'loved_one' = 'student';
    let studentId = user.id;
    let lovedOneIdFinal = lovedOneId;

    // If not found, check if user is loved one calling student
    if (!connection) {
      const { data: reverseConnection } = await adminClient
        .from('awy_connections')
        .select('id, status, student_id, loved_one_id')
        .eq('loved_one_id', user.id)
        .eq('student_id', lovedOneId)
        .in('status', ['granted', 'active', 'accepted'])
        .maybeSingle();
      
      if (reverseConnection) {
        connection = reverseConnection;
        caller = 'loved_one';
        studentId = lovedOneId; // The target is the student
        lovedOneIdFinal = user.id; // User is the loved one
      }
    }

    if (!connection) {
      return res.status(403).json({ error: 'No valid connection with this person' });
    }

    // Check for existing ringing call (check both directions)
    const { data: existingCall } = await adminClient
      .from('awy_calls')
      .select('id')
      .eq('student_id', studentId)
      .eq('loved_one_id', lovedOneIdFinal)
      .eq('status', 'ringing')
      .maybeSingle();

    if (existingCall) {
      return res.status(400).json({ error: 'Call already in progress' });
    }

    // Create Daily room
    const roomName = `awy-${user.id.slice(0, 8)}-${lovedOneId.slice(0, 8)}-${Date.now()}`;
    
    if (!DAILY_API_KEY) {
      // Fallback for development - return mock URL
      console.warn('[AWY Call] No DAILY_API_KEY set, using mock');
      const mockRoomUrl = `https://${DAILY_DOMAIN}.daily.co/${roomName}`;
      
      const { data: call, error: insertError } = await adminClient
        .from('awy_calls')
        .insert({
          student_id: studentId,
          loved_one_id: lovedOneIdFinal,
          caller_id: user.id,
          room_url: mockRoomUrl,
          room_name: roomName,
          status: 'ringing'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return res.status(200).json({
        callId: call.id,
        roomUrl: mockRoomUrl,
        roomName
      });
    }

    // Create Daily room via API
    const dailyResponse = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`
      },
      body: JSON.stringify({
        name: roomName,
        properties: {
          exp: Math.floor(Date.now() / 1000) + (2 * 60 * 60), // 2 hours
          enable_screenshare: true,
          start_video_off: false,
          start_audio_off: false,
          enable_chat: true,
          enable_knocking: false,
          max_participants: 2
        }
      })
    });

    if (!dailyResponse.ok) {
      const errorData = await dailyResponse.json();
      console.error('[AWY Call] Daily API error:', errorData);
      throw new Error('Failed to create video room');
    }

    const dailyRoom = await dailyResponse.json();
    const roomUrl = dailyRoom.url;

    // Insert call record
    const { data: call, error: insertError } = await adminClient
      .from('awy_calls')
      .insert({
        student_id: studentId,
        loved_one_id: lovedOneIdFinal,
        caller_id: user.id,
        room_url: roomUrl,
        room_name: roomName,
        status: 'ringing'
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return res.status(200).json({
      callId: call.id,
      roomUrl,
      roomName
    });

  } catch (error: any) {
    console.error('[AWY Call] Start error:', error);
    return res.status(500).json({ error: error.message || 'Failed to start call' });
  }
}
