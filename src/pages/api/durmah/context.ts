import type { NextApiRequest, NextApiResponse } from 'next';
import { buildDurmahContext } from '@/lib/durmah/contextBuilder';
import type { StudentContext } from '@/types/durmahContext';

/**
 * P1-4 FIX: Rewritten to use existing buildDurmahContext
 * 
 * Previously: Hardcoded term/week + empty timetable
 * Now: Uses rich builder that computes real term/week from academic calendar
 * and fetches actual timetable events from database
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StudentContext | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use existing context builder (ChatGPT recommended)
    const result = await buildDurmahContext(req);
    
    if (!result.ok) {
      if (result.status === 'unauthorized') {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      return res.status(500).json({ error: 'Context builder misconfigured' });
    }

    const { context } = result;

    // Build StudentContext from rich context packet
    const studentContext: StudentContext = {
      student: {
        displayName: context.profile.displayName || 'Student',
        yearGroup: context.profile.yearOfStudy || context.profile.yearGroup || 'Year 1',
        term: context.academic.term,             // ← REAL (computed from calendar)
        weekOfTerm: context.academic.weekOfTerm || 1,  // ← REAL
        localTimeISO: context.academic.localTimeISO,
      },
      assignments: {
        upcoming: [],  // TODO: Wire to builder if assignments added
        overdue: [],
        recentlyCreated: [],
        total: 0,
      },
      schedule: {
        todaysClasses: context.schedule?.today?.map(t => ({
          title: t.title,
          start: t.start,
          end: t.end,
          location: t.location,
        })) || [],
      },
    };

    return res.status(200).json(studentContext);
  } catch (error: any) {
    console.error('[durmah/context] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
