import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { parseICSContent, ParsedEvent, ParsedAssessment } from '@/lib/calendar/icsParser';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Authenticate user
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { timetableUrl, blackboardUrl } = req.body;

    // 2. Update profile with URLs
    if (timetableUrl || blackboardUrl) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          timetable_url: timetableUrl || null,
          blackboard_url: blackboardUrl || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) {
        // Log but continue, passing valid URLs is enough to proceed with sync
        console.error('Failed to update profile URLs', profileError);
      }
    }

    const results = {
      timetable: { events: 0, assessments: 0, status: 'skipped' },
      blackboard: { events: 0, assessments: 0, status: 'skipped' }
    };

    // 3. Process Timetable URL
    if (timetableUrl && typeof timetableUrl === 'string') {
      try {
        const icsContent = await fetchICS(timetableUrl);
        const parsed = parseICSContent(icsContent);
        await saveEvents(user.id, parsed.events, 'timetable');
        // Usually timetable doesn't have assessments, but we'll save them if found
        await saveAssessments(user.id, parsed.assessments, 'timetable');
        
        results.timetable = {
          events: parsed.events.length,
          assessments: parsed.assessments.length,
          status: 'success'
        };
      } catch (err) {
        console.error('Timetable sync failed', err);
        results.timetable.status = 'failed';
      }
    }

    // 4. Process Blackboard URL
    if (blackboardUrl && typeof blackboardUrl === 'string') {
      try {
        const icsContent = await fetchICS(blackboardUrl);
        const parsed = parseICSContent(icsContent);
        await saveEvents(user.id, parsed.events, 'blackboard');
        await saveAssessments(user.id, parsed.assessments, 'blackboard');
        
        results.blackboard = {
          events: parsed.events.length,
          assessments: parsed.assessments.length,
          status: 'success'
        };
      } catch (err) {
        console.error('Blackboard sync failed', err);
        results.blackboard.status = 'failed';
      }
    }

    return res.status(200).json({ success: true, results });
  } catch (error) {
    console.error('Sync error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function fetchICS(url: string): Promise<string> {
  // Determine if it's a webcal:// URL, replace with https://
  let fetchUrl = url;
  if (url.startsWith('webcal://')) {
    fetchUrl = url.replace('webcal://', 'https://');
  }
  
  const response = await fetch(fetchUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch ICS from ${url}: ${response.statusText}`);
  }
  return response.text();
}

async function saveEvents(userId: string, events: ParsedEvent[], source: string) {
  if (events.length === 0) return;

  const rows = events.map(ev => ({
    user_id: userId,
    external_id: ev.externalId,
    title: ev.title,
    description: ev.description,
    location: ev.location,
    start_at: ev.startAt,
    end_at: ev.endAt,
    all_day: ev.allDay,
    module_code: ev.moduleCode,
    event_type: ev.eventType || 'other',
    source: 'ics',
    source_meta: { original_url_source: source },
    verified: true
  }));

  // Batch insert/upsert
  // Supabase upsert requires specifying the onConflict column(s)
  const { error } = await supabaseAdmin
    .from('user_events')
    .upsert(rows, { onConflict: 'user_id, external_id' });

  if (error) throw error;
}

async function saveAssessments(userId: string, assessments: ParsedAssessment[], source: string) {
  if (assessments.length === 0) return;

  const rows = assessments.map(ass => ({
    user_id: userId,
    title: ass.title,
    description: ass.description,
    due_at: ass.dueAt,
    module_code: ass.moduleCode,
    assessment_type: ass.assessmentType?.toLowerCase() || 'other',
    source: 'ics',
    source_meta: { original_url_source: source },
    verified: true // Assume trusted if coming from official calendar
  }));

  // Batch insert/upsert
  // onConflict: user_id, module_code, title, due_at
  const { error } = await supabaseAdmin
    .from('user_assessments')
    .upsert(rows, { onConflict: 'user_id, module_code, title, due_at' });

  if (error) throw error;
}
