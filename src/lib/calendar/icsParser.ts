import ICAL from 'ical.js';

export interface ParsedEvent {
  title: string;
  description?: string;
  location?: string;
  startAt: string;
  endAt?: string;
  allDay: boolean;
  externalId: string;
  moduleCode?: string;
  eventType?: string;
}

export interface ParsedAssessment {
  title: string;
  description?: string;
  dueAt: string;
  moduleCode?: string;
  assessmentType?: string;
}

function extractModuleCode(text: string): string | null {
  // Extract module codes like LAW1051, X_LAW_DLS_2025, etc.
  const match = text.match(/\b([A-Z_]+\d{3,4}[A-Z]?|[A-Z]+_[A-Z]+_[A-Z0-9]+)\b/);
  return match ? (match[1] ?? null) : null;
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

export function parseICSContent(fileContent: string): { events: ParsedEvent[], assessments: ParsedAssessment[] } {
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
          moduleCode: moduleCode || undefined,
          assessmentType: eventType === 'exam' ? 'Exam' : 'Assignment'
        });
      }

      // Add to events list (we add everything to events too, for completeness in calendar view)
      events.push({
        title: summary,
        description,
        location,
        startAt,
        endAt: endAt || undefined,
        allDay,
        externalId: uid,
        moduleCode: moduleCode || undefined,
        eventType
      });
    }
  } catch (error) {
    console.error('[ICS Parse Error]', error);
    throw new Error(`Failed to parse ICS content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { events, assessments };
}
