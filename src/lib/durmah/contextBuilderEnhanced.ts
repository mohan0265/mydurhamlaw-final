import type { SupabaseClient } from '@supabase/supabase-js';
import type { DurmahContextPacket } from '@/types/durmah';

// Durham Term Calendar 2025-26
const DURHAM_TERMS = [
  { term: 'Michaelmas', start: '2025-10-06', end: '2025-12-12' },
  { term: 'Epiphany', start: '2026-01-12', end: '2026-03-20' },
  { term: 'Easter', start: '2026-04-27', end: '2026-06-19' },
];

function computeAcademicContext() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  let term = 'Vacation';
  let weekOfTerm = 0;
  
  for (const window of DURHAM_TERMS) {
    const start = new Date(window.start);
    const end = new Date(window.end);
    if (today >= start && today <= end) {
      term = window.term;
      const diffMs = today.getTime() - start.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      weekOfTerm = Math.floor(diffDays / 7) + 1;
      break;
    }
  }
  
  return { term, weekOfTerm };
}

/**
 * Enhanced context builder for Durmah Core
 * Fetches assignment progress (AW tables) and AWY presence data
 * to augment base context packet with student-aware information
 */

export async function fetchAssignmentsContext(
  supabase: SupabaseClient,
  userId: string
): Promise<DurmahContextPacket['assignments']> {
  const now = new Date();

  // Fetch all assignments for user
  const { data: assignmentData } = await supabase
    .from('assignments')
    .select('id, title, module_code, status, due_date, created_at, updated_at')
    .eq('user_id', userId)
    .order('due_date', { ascending: true });

  // Fetch assignment progress from AW tables
  const { data: progressData } = await supabase
    .from('assignment_progress')
    .select('assignment_id, step_key, updated_at')
    .eq('user_id', userId);

  // Build progress map (latest step per assignment)
  const progressMap = new Map<string, { step: string; updated: string }>();
  (progressData || []).forEach(p => {
    const existing = progressMap.get(p.assignment_id);
    if (!existing || new Date(p.updated_at) > new Date(existing.updated)) {
      progressMap.set(p.assignment_id, { step: p.step_key, updated: p.updated_at });
    }
  });

  // Active assignments (not completed)
  const activeAssignments = (assignmentData || [])
    .filter(a => a.status !== 'completed')
    .slice(0, 5)
    .map(a => {
      const progress = progressMap.get(a.id);
      return {
        id: a.id,
        title: a.title || 'Untitled Assignment',
        module: a.module_code || 'Unknown Module',
        status: a.status || 'active',
        currentStage: progress?.step || 'not_started',
        nextStep: progress?.step ? `Continue ${progress.step}` : 'Start assignment',
        dueDate: a.due_date || undefined,
        progress: 0, // TODO: Calculate percentage from stage
      };
    });

  // Recently completed
  const recentlyCompleted = (assignmentData || [])
    .filter(a => a.status === 'completed')
    .slice(0, 3)
    .map(a => ({
      id: a.id,
      title: a.title || 'Untitled Assignment',
      module: a.module_code || 'Unknown Module',
      completedAt: a.updated_at || a.created_at,
    }));

  // Overdue assignments
  const overdueAssignments = (assignmentData || [])
    .filter(a => a.status !== 'completed' && a.due_date && new Date(a.due_date) < now)
    .map(a => ({
      id: a.id,
      title: a.title || 'Untitled Assignment',
      module: a.module_code || 'Unknown Module',
      daysOver: Math.floor((now.getTime() - new Date(a.due_date!).getTime()) / (1000 * 60 * 60 * 24)),
    }));

  return {
    active: activeAssignments,
    recentlyCompleted,
    overdue: overdueAssignments,
    total: assignmentData?.length || 0,
  };
}

/**
 * Helper to fetch detailed content for a specific lecture
 * Falls back to raw transcript if notes are missing
 */
async function fetchLectureDetails(supabase: SupabaseClient, lectureId: string) {
    try {
        // 1. Try Notes/Summary
        const { data: notes } = await supabase
            .from('lecture_notes')
            .select('summary, key_points, engagement_hooks')
            .eq('lecture_id', lectureId)
            .maybeSingle();

        if (notes) {
            return {
                summary: notes.summary,
                key_points: notes.key_points ? (Array.isArray(notes.key_points) ? notes.key_points : []) : [],
                engagement_hooks: notes.engagement_hooks ? (Array.isArray(notes.engagement_hooks) ? notes.engagement_hooks : []) : [],
            };
        }

        // 2. Fallback to Transcript
        const { data: transcript } = await supabase
            .from('lecture_transcripts')
            .select('transcript_text')
            .eq('lecture_id', lectureId)
            .maybeSingle();

        if (transcript?.transcript_text) {
            return {
                summary: undefined,
                key_points: [],
                engagement_hooks: [],
                transcript_snippet: transcript.transcript_text.substring(0, 4000) // Truncate
            };
        }
    } catch (e) {
        console.error('Error fetching lecture details:', e);
    }
    return null;
}

/**
 * Fetch recent lectures METADATA only for global Durmah context
 * AND fetch detailed content for the Active or Latest lecture (Central Intelligence)
 */
export async function fetchLecturesContext(
  supabase: SupabaseClient,
  userId: string,
  activeLectureId?: string
): Promise<{
  recent: Array<{
    id: string;
    title: string;
    module_code?: string;
    module_name?: string;
    lecturer_name?: string;
    lecture_date?: string;
    status: string;
  }>;
  current?: DurmahContextPacket['lectures']['current']; // Use the type from DurmahContextPacket
  total: number;
}> {
  // Fetch recent lectures - METADATA ONLY (no notes join)
  const { data: lectures } = await supabase
    .from('lectures')
    .select('id, title, module_code, module_name, lecturer_name, lecture_date, status')
    .eq('user_id', userId)
    .order('lecture_date', { ascending: false, nullsFirst: false }) // Fetch all recent, regardless of status for list
    .limit(5);

  const recentLectures = (lectures || []).map(l => ({
    id: l.id,
    title: l.title,
    module_code: l.module_code,
    module_name: l.module_name,
    lecturer_name: l.lecturer_name,
    lecture_date: l.lecture_date,
    status: l.status,
  }));

  // CENTRAL INTELLIGENCE: Determine which lecture is "Current"
  let currentLectureDetails = null;
  let targetLecture = null;

  if (activeLectureId) {
      // Case A: User is ON a specific lecture page
      targetLecture = recentLectures.find(l => l.id === activeLectureId);
      // If not in recent list, we might need to fetch metadata separately, but for now assume in list or we just fetch details
      if (!targetLecture) {
           // Fetch metadata if not in recent list
           const { data: specific } = await supabase.from('lectures').select('id, title, module_name').eq('id', activeLectureId).maybeSingle();
           if (specific) targetLecture = specific;
      }
  } else if (recentLectures.length > 0) {
      // Case B: Global Scope - Use the LATEST lecture as context
      targetLecture = recentLectures[0];
  }

  if (targetLecture) {
      const details = await fetchLectureDetails(supabase, targetLecture.id);
      if (details) {
          currentLectureDetails = {
              id: targetLecture.id,
              title: targetLecture.title,
              module_name: targetLecture.module_name,
              ...details
          };
      }
  }

  return {
    recent: recentLectures,
    current: currentLectureDetails || undefined,
    total: lectures?.length || 0,
  };
}

export async function fetchAWYContext(
  supabase: SupabaseClient,
  userId: string
): Promise<DurmahContextPacket['awy'] | undefined> {
  // Fetch AWY connections where user is the student
  const { data: awyConnections } = await supabase
    .from('awy_connections')
    .select('id, loved_one_name, relation, status, loved_user_id, loved_one_id')
    .or(`student_user_id.eq.${userId},student_id.eq.${userId}`)
    .eq('status', 'active')
    .limit(5);

  if (!awyConnections || awyConnections.length === 0) {
    return undefined;
  }

  // Get presence data for connected loved ones
  const lovedOneUserIds = awyConnections
    .map(c => c.loved_user_id || c.loved_one_id)
    .filter(Boolean) as string[];

  if (lovedOneUserIds.length === 0) {
    return {
      lovedOnes: [],
      hasConnections: true,
    };
  }

  const { data: presenceData } = await supabase
    .from('awy_presence')
    .select('user_id, status, is_available, last_seen_at')
    .in('user_id', lovedOneUserIds);

  const presenceMap = new Map((presenceData || []).map(p => [p.user_id, p]));

  const lovedOnes = awyConnections.map(c => {
    const lovedOneId = c.loved_user_id || c.loved_one_id;
    const presence = lovedOneId ? presenceMap.get(lovedOneId) : undefined;
    
    return {
      id: c.id,
      name: c.loved_one_name || 'Loved One',
      relation: c.relation || 'Family',
      status: (presence?.status as 'online' | 'away' | 'offline') || 'offline',
      lastSeen: presence?.last_seen_at || null,
      isAvailable: presence?.is_available || false,
    };
  });

  return {
    lovedOnes,
    hasConnections: true,
  };
}

/**
 * Fetch user profile for personalization (name, year group)
 */
export async function fetchProfileContext(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  displayName: string | null;
  yearGroup: string | null;
  yearOfStudy: string | null;
}> {
  const { data } = await supabase
    .from('profiles')
    .select('display_name, year_group, year_of_study')
    .eq('id', userId)
    .maybeSingle();

  return {
    displayName: data?.display_name ?? null,
    yearGroup: data?.year_of_study ?? data?.year_group ?? null,
    yearOfStudy: data?.year_of_study ?? data?.year_group ?? null,
    role: 'student' // Default role
  };
}

/**
 * Enhance base context packet with assignments, AWY data, lectures, profile, and academic
 */

/**
 * Fetch Context-Specific Chat History (Stage A)
 */
export async function fetchConversationHistory(
  supabase: SupabaseClient,
  conversationId: string,
  limit = 10
) {
  const { data } = await supabase
    .from('durmah_messages')
    .select('role, content, created_at, saved_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);
    
  return (data || []).reverse().map(m => ({
    role: m.role,
    content: m.content,
    ts: m.created_at,
    saved_at: m.saved_at
  }));
}

/**
 * Fetch Global Chat Tail (Stage B - Continuity)
 */
export async function fetchGlobalChatTail(
  supabase: SupabaseClient,
  userId: string,
  limit = 6
) {
  const { data } = await supabase
    .from('durmah_messages')
    .select('role, content, created_at, scope, saved_at')
    .eq('user_id', userId)
    .eq('scope', 'global')
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data || []).reverse().map(m => ({
    role: m.role,
    content: m.content,
    ts: m.created_at,
    saved_at: m.saved_at
  }));
}

export async function enhanceDurmahContext(
  supabase: SupabaseClient,
  userId: string,
  baseContext: DurmahContextPacket,
  conversationId?: string,
  activeLectureId?: string 
): Promise<DurmahContextPacket> {
  // Fetch enhanced context in parallel
  const [assignments, awy, lectures, profile, globalTail] = await Promise.all([
    fetchAssignmentsContext(supabase, userId),
    fetchAWYContext(supabase, userId),
    fetchLecturesContext(supabase, userId, activeLectureId), // PASS activeLectureId
    fetchProfileContext(supabase, userId),
    fetchGlobalChatTail(supabase, userId)
  ]);

  let localHistory: any[] = [];
  if (conversationId) {
      localHistory = await fetchConversationHistory(supabase, conversationId);
  }

  // Compute academic context (term, week)
  const academic = computeAcademicContext();

  return {
    ...baseContext,
    assignments,
    awy,
    lectures,
    profile, // CRITICAL: Include profile for personalization
    academic, // CRITICAL: Include term/week for context
    recentMemories: [...globalTail, ...localHistory] // Merge for now, or keep separate? 
    // Ideally we want to pass them separate so Prompt Builder can label them.
    // But StudentContext interface just has 'recentMemories'. 
    // I will merge them but maybe Prompt knows?
    // Actually, let's keep it simple: merge unique messages.
  };
}
