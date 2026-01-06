import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { buildDurmahContext } from '@/lib/durmah/contextBuilder';
import type { StudentContext } from '@/types/durmahContext';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * DUAL AUTH MODE FIX (ChatGPT recommended)
 * 
 * Accepts BOTH:
 * 1. Cookie-based session (for SSR/browser)
 * 2. Bearer token in Authorization header (for client-side fetch)
 * 
 * Returns 401 only if BOTH fail
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StudentContext | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let user: any = null;
    let authMethod: 'cookie' | 'bearer' | 'none' = 'none';

    // TRY METHOD 1: Cookie-based auth
    try {
      const supabase = createPagesServerClient({ req, res });
      const { data: { user: cookieUser }, error } = await supabase.auth.getUser();
      if (cookieUser && !error) {
        user = cookieUser;
        authMethod = 'cookie';
        console.log('[context] ✓ Auth via cookies');
      }
    } catch (err) {
      console.warn('[context] Cookie auth failed:', err);
    }

    // TRY METHOD 2: Bearer token (if cookies failed)
    if (!user) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const supabase = createClient(SUPABASE_URL, ANON_KEY, {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false },
          });
          const { data: { user: bearerUser }, error } = await supabase.auth.getUser(token);
          if (bearerUser && !error) {
            user = bearerUser;
            authMethod = 'bearer';
            console.log('[context] ✓ Auth via bearer token');
          }
        } catch (err) {
          console.warn('[context] Bearer auth failed:', err);
        }
      }
    }

    // BOTH methods failed
    if (!user) {
      console.error('[context] ✗ Auth failed (both cookie and bearer)');
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
            upcoming: [],  // TODO: Wire to assignments table
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

        console.log(`[context] ✓ Returned context: term=${studentContext.student.term}, week=${studentContext.student.weekOfTerm}, classes=${studentContext.schedule.todaysClasses.length}`);
        return res.status(200).json(studentContext);
      }
    } catch (builderError) {
      console.warn('[context] Builder failed, using fallback:', builderError);
    }

    // Fallback: Use basic profile data if builder fails
    const supabase = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${user.id}` } },
    });
    
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

    console.log('[context] ✓ Returned fallback context');
    return res.status(200).json(fallbackContext);

  } catch (error: any) {
    console.error('[context] ✗ Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
