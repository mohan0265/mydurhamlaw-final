import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { buildDurmahContext } from '@/lib/durmah/contextBuilder';
import type { StudentContext } from '@/types/durmahContext';

/**
 * HOTFIX: Auth compatibility fix
 * - Use createPagesServerClient for cookie-based auth (reliable)
 * - Still use buildDurmahContext data for real term/week/timetable
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StudentContext | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // HOTFIX: Use cookie-based auth first (more reliable for frontend calls)
    const supabase = createPagesServerClient({ req, res });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (!user || authError) {
      console.error('[context] Auth failed:', authError?.message);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Try to use buildDurmahContext for rich data
    try {
      const result = await buildDurmahContext(req);
      
      if (result.ok) {
        const { context } = result;
        
        // Build StudentContext from rich context packet
        const studentContext: StudentContext = {
          student: {
            displayName: context.profile.displayName || user.email?.split('@')[0] || 'Student',
            yearGroup: context.profile.yearOfStudy || context.profile.yearGroup || 'Year 1',
            term: context.academic.term,
            weekOfTerm: context.academic.weekOfTerm || 1,
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
      }
    } catch (builderError) {
      console.warn('[context] Builder failed, using fallback:', builderError);
    }

    // Fallback: Use basic profile data if builder fails
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, year_group, year_of_study')
      .eq('id', user.id)
      .maybeSingle();

    const fallbackContext: StudentContext = {
      student: {
        displayName: profile?.display_name || user.email?.split('@')[0] || 'Student',
        yearGroup: profile?.year_of_study || profile?.year_group || 'Year 1',
        term: 'Epiphany',  // Current term as of Jan 2026
        weekOfTerm: 3,     // Approximate week
        localTimeISO: new Date().toISOString(),
      },
      assignments: {
        upcoming: [],
        overdue: [],
        recentlyCreated: [],
        total: 0,
      },
      schedule: {
        todaysClasses: [],
      },
    };

    return res.status(200).json(fallbackContext);

  } catch (error: any) {
    console.error('[context] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
