import type { SupabaseClient } from '@supabase/supabase-js';
import type { DurmahContextPacket } from '@/types/durmah';

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
 * Enhance base context packet with assignments and AWY data
 */
export async function enhanceDurmahContext(
  supabase: SupabaseClient,
  userId: string,
  baseContext: DurmahContextPacket
): Promise<DurmahContextPacket> {
  // Fetch enhanced context in parallel
  const [assignments, awy] = await Promise.all([
    fetchAssignmentsContext(supabase, userId),
    fetchAWYContext(supabase, userId),
  ]);

  return {
    ...baseContext,
    assignments,
    awy,
  };
}
