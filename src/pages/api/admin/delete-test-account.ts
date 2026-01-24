// API Route: Delete Test Account (Safety: only deletes if is_test_account = true)
import type { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'cookie';
import { createHmac } from 'crypto';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';

const COOKIE_NAME = 'admin_session';

function expectedToken() {
  const adminUser = process.env.ADMIN_USERNAME;
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminUser || !adminPass) return null;
  return createHmac('sha256', adminPass).update(adminUser).digest('hex');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = parse(req.headers.cookie || '')[COOKIE_NAME];
  const exp = expectedToken();
  if (!token || !exp || token !== exp) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const adminClient = getSupabaseAdmin();
  if (!adminClient) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  try {
    // SAFETY CHECK: Only delete if is_test_account = true
    const { data: profile, error: fetchError } = await adminClient
      .from('profiles')
      .select('is_test_account, user_role')
      .eq('id', userId) // Fix: Profiles table uses 'id' as PK
      .single();

    if (fetchError || !profile) {
      console.error('Profile fetch error:', fetchError);
      return res.status(404).json({ error: `Profile ${userId} not found in database.` });
    }

    if (!profile.is_test_account) {
      return res.status(403).json({ error: 'Cannot delete non-test account. Safety check failed.' });
    }

    // --- MISSION CRITICAL: PRE-DELETE DEEP CLEAN ---
    // We explicitly wipe all public data for this user ID to ensure no FKs block auth deletion.
    
    // 1. Social & Presence
    await adminClient.from('awy_connections').delete().or(`student_user_id.eq.${userId},loved_user_id.eq.${userId},student_id.eq.${userId},loved_one_id.eq.${userId}`);
    await adminClient.from('awy_presence').delete().eq('user_id', userId);
    await adminClient.from('awy_calls').delete().or(`student_id.eq.${userId},loved_one_id.eq.${userId}`);

    // 2. Academic Support (Durmah & Quizzes)
    // Note: Most of these have CASCADE in migrations, but explicit deletion is safer for blocking FKs.
    await adminClient.from('durmah_sessions').delete().eq('user_id', userId);
    await adminClient.from('quiz_sessions').delete().eq('user_id', userId);
    await adminClient.from('durmah_interest_events').delete().eq('user_id', userId);
    await adminClient.from('durmah_nudges').delete().eq('user_id', userId);
    await adminClient.from('durmah_user_memory').delete().eq('user_id', userId);

    // 3. Assignments & Calendar
    await adminClient.from('assignments').delete().eq('user_id', userId);
    await adminClient.from('assignment_progress').delete().eq('user_id', userId);
    await adminClient.from('exam_preparation').delete().eq('user_id', userId);
    await adminClient.from('exam_signals').delete().eq('user_id', userId);
    await adminClient.from('personal_items').delete().eq('user_id', userId);
    await adminClient.from('timetable_events').delete().eq('user_id', userId);

    // 4. History & Metadata
    await adminClient.from('user_onboarding').delete().eq('user_id', userId);
    await adminClient.from('memory_logs').delete().eq('user_id', userId);
    await adminClient.from('memory_notes').delete().eq('user_id', userId);
    await adminClient.from('ai_history').delete().eq('user_id', userId);
    await adminClient.from('support_user_issue_summaries').delete().eq('user_id', userId);
    await adminClient.from('lectures').delete().eq('user_id', userId);

    // 5. Final Profile Delete
    await adminClient.from('profiles').delete().eq('id', userId);

    // FINAL: Delete auth user
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error('Final Auth Delete Error:', authDeleteError);
      return res.status(400).json({ error: `User profile cleared, but Auth deletion failed: ${authDeleteError.message}. This usually happens if there are ancora references in non-standard schemas.` });
    }

    return res.status(200).json({ success: true, deletedUserId: userId });
  } catch (error: any) {
    console.error('Delete handler crash:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
