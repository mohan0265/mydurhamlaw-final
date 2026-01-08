import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';
import ICAL from 'ical.js';

// Disable body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ParsedEvent {
  title: string;
  description?: string;
  location?: string;
  startAt: string;
  endAt?: string;
  allDay: boolean;
  externalId: string;
  moduleCode?: string;
}

interface ParsedAssessment {
  title: string;
  description?: string;
  dueAt: string;
  moduleCode?: string;
}

function extractModuleCode(text: string): string | null {
  // Extract module codes like LAW1051, X_LAW_DLS_2025, etc.
  const match = text.match(/\b([A-Z_]+\d{3,4}[A-Z]?|[A-Z]+_[A-Z]+_[A-Z0-9]+)\b/);
  return match ? match[1] : null;
}

function classifyEventType(summary: string, description: string = ''): string {
  const text = (summary + ' ' + description).toLowerCase();
  
  if (text.includes('lecture')) return 'lecture';
  if (text.includes('seminar')) return 'seminar';
  if (text.includes('tutorial')) return 'tutorial';
  if (text.includes('lab') || text.includes('workshop')) return 'lab';
  if (text.includes('exam')) return 'exam';
  if (text.includes('deadline') || text.includes('due') || text.includes('submit')) return 'deadline';
  
  return 'other';
}

function isAssessmentEvent(summary: string, description: string = ''): boolean {
  const text = (summary + ' ' + description).toLowerCase();
  return text.includes('deadline') || 
         text.includes('due') || 
         text.includes('submit') ||
         text.includes('assessment') ||
         text.includes('coursework');
}

function parseICSFile(fileContent: string): { events: ParsedEvent[], assessments: ParsedAssessment[] } {
  const events: ParsedEvent[] = [];
  const assessments: ParsedAssessment[] = [];

  try {
    const jcalData = ICAL.parse(fileContent);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');

    for (const vevent of vevents) {
      const event = new ICAL.Event(vevent);
      
      const summary = event.summary || 'Untitled Event';
      const description = event.description || '';
      const location = event.location || '';
      const uid = event.uid || `generated-${Date.now()}-${Math.random()}`;
      
      const startDate = event.startDate;
      const endDate = event.endDate;
      
      if (!startDate) continue; // Skip events without start date
      
      const startAt = startDate.toJSDate().toISOString();
      const endAt = endDate ? endDate.toJSDate().toISOString() : undefined;
      const allDay = startDate.isDate; // True if date-only (no time)
      
      const moduleCode = extractModuleCode(summary) || extractModuleCode(description);
      const eventType = classifyEventType(summary, description);

      // Determine if this is an assessment deadline
      if (isAssessmentEvent(summary, description)) {
        assessments.push({
          title: summary,
          description,
          dueAt: startAt,
          moduleCode: moduleCode ||  undefined,
        });
      }

      // Add to events list
      events.push({
        title: summary,
        description,
        location,
        startAt,
        endAt: endAt || undefined,
        allDay,
        externalId: uid,
        moduleCode: moduleCode || undefined,
      });
    }
  } catch (error) {
    console.error('[ICS Parse Error]', error);
    throw new Error(`Failed to parse ICS file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { events, assessments };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get authenticated user
    const authHeader = req.headers.authorization;
    const cookies = req.headers.cookie || '';
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader?.replace('Bearer ', '') || ''
    );

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Parse multipart form data
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB max
      filter: (part) => {
        return !!(
          part.mimetype?.includes('calendar') ||
          part.mimetype?.includes('text') ||
          part.originalFilename?.toLowerCase().endsWith('.ics')
        );
      },
    });

    const [fields, files] = await form.parse(req);
    const uploadedFile = files.file?.[0];

    if (!uploadedFile) {
      return res.status(400).json({ error: 'No ICS file uploaded' });
    }

    // Read file content
    const fileContent = fs.readFileSync(uploadedFile.filepath, 'utf-8');
    
    // Create import job
    const { data: importJob, error: jobError } = await supabaseAdmin
      .from('import_jobs')
      .insert({
        user_id: user.id,
        kind: 'ics',
        status: 'processing',
      })
      .select()
      .single();

    if (jobError || !importJob) {
      console.error('[Import Job Error]', jobError);
      return res.status(500).json({ error: 'Failed to create import job' });
    }

    try {
      // Parse ICS file
      const { events, assessments } = parseICSFile(fileContent);

      // Store import source
      const { data: importSource } = await supabaseAdmin
        .from('import_sources')
        .insert({
          user_id: user.id,
          import_job_id: importJob.id,
          kind: 'ics',
          filename: uploadedFile.originalFilename || 'calendar.ics',
          file_size_bytes: uploadedFile.size,
        })
        .select()
        .single();

      // Insert events (will auto-update completeness via trigger)
      const eventsToInsert = events.map(e => ({
        user_id: user.id,
        import_source_id: importSource?.id,
        external_id: e.externalId,
        title: e.title,
        description: e.description,
        location: e.location,
        start_at: e.startAt,
        end_at: e.endAt,
        all_day: e.allDay,
        module_code: e.moduleCode,
        event_type: classifyEventType(e.title, e.description || ''),
        source: 'ics',
        source_meta: { raw_summary: e.title },
      }));

      const { error: eventsError } = await supabaseAdmin
        .from('user_events')
        .upsert(eventsToInsert, {
          onConflict: 'user_id,external_id',
          ignoreDuplicates: false,
        });

      if (eventsError) {
        console.error('[Events Insert Error]', eventsError);
        throw new Error('Failed to insert events');
      }

      // Insert assessments
      const assessmentsToInsert = assessments.map(a => ({
        user_id: user.id,
        import_source_id: importSource?.id,
        module_code: a.moduleCode,
        title: a.title,
        description: a.description,
        due_at: a.dueAt,
        source: 'ics',
        verified: false, // Assessments need user verification
      }));

      if (assessmentsToInsert.length > 0) {
        const { error: assessmentsError } = await supabaseAdmin
          .from('user_assessments')
          .upsert(assessmentsToInsert, {
            onConflict: 'user_id,module_code,title,due_at',
            ignoreDuplicates: false,
          });

        if (assessmentsError) {
          console.error('[Assessments Insert Error]', assessmentsError);
        }
      }

      // Update job status
      await supabaseAdmin
        .from('import_jobs')
        .update({
          status: 'completed',
          finished_at: new Date().toISOString(),
        })
        .eq('id', importJob.id);

      // Clean up temp file
      fs.unlinkSync(uploadedFile.filepath);

      return res.status(200).json({
        success: true,
        imported: {
          events: events.length,
          assessments: assessments.length,
        },
        job_id: importJob.id,
      });

    } catch (parseError) {
      // Update job status to failed
      await supabaseAdmin
        .from('import_jobs')
        .update({
          status: 'failed',
          finished_at: new Date().toISOString(),
          error_text: parseError instanceof Error ? parseError.message : 'Parse failed',
        })
        .eq('id', importJob.id);

      throw parseError;
    }

  } catch (error) {
    console.error('[ICS Upload Error]', error);
    return res.status(500).json({
      error: 'Failed to process ICS file',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
