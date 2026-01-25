import { SupabaseClient } from '@supabase/supabase-js';

// Type definitions for the unified context packet
export interface DurmahModuleContext {
  module: { id: string; title: string; code: string; term: string };
  lectures: Array<{ id: string; title: string; content_excerpt: string; date: string }>;
  assignments: Array<{ id: string; title: string; status: string; due_date: string }>;
  quiz_insights: {
    recent_scores: Array<{ score: number; date: string }>;
    weak_areas: string[]; 
  };
  exam: {
    workspace_id: string;
    artifacts: Array<{ id: string; type: string; title: string }>;
  };
}

/**
 * Builds a unified, module-grounded context packet for Durmah.
 * This is the CENTRAL "Brain" logic for ensuring answers are grounded.
 */
export async function buildModuleContext(
  supabase: SupabaseClient,
  userId: string,
  moduleId: string
): Promise<DurmahModuleContext> {
  
  // 1. Fetch Module Details
  const { data: moduleData } = await supabase
    .from('modules')
    .select('*')
    .eq('id', moduleId)
    .single();

  if (!moduleData) throw new Error('Module not found');

  // 2. Fetch Signed Lectures (Metadata + Snippet of content)
  // Optimize: Don't load full transcripts here, just enough for context awareness
  const { data: lectures } = await supabase
    .from('lectures')
    .select('id, title, lecture_date') // Add content_md if short? Or rely on RAG retrieval later
    .eq('module_id', moduleId)
    .order('lecture_date', { ascending: false })
    .limit(10);
  
  const lecturesMapped = (lectures || []).map(l => ({
      id: l.id,
      title: l.title,
      date: l.lecture_date,
      content_excerpt: 'Available in secure context' // Placeholder for token economy
  }));

  // 3. Fetch Assignments
  const { data: assignments } = await supabase
    .from('assignments')
    .select('id, title, status, due_date')
    .eq('module_id', moduleId)
    .neq('status', 'completed') // Focus on active work
    .limit(5);

  // 4. Fetch Quiz Insights (Aggregated)
  const { data: quizSessions } = await supabase
    .from('quiz_sessions')
    .select('performance_metadata')
    .eq('module_id', moduleId);
  
  // Minimal aggregation logic
  const scores = quizSessions?.map(q => q.performance_metadata?.score).filter(s => typeof s === 'number') || [];
  
  // 5. Fetch Exam Artifacts
  const { data: workspace } = await supabase
    .from('exam_workspaces')
    .select('id')
    .eq('module_id', moduleId)
    .single();

  let artifacts: any[] = [];
  if (workspace) {
      const { data: arts } = await supabase
          .from('exam_artifacts')
          .select('id, type, title')
          .eq('workspace_id', workspace.id);
      artifacts = arts || [];
  }

  return {
    module: moduleData,
    lectures: lecturesMapped,
    assignments: assignments || [],
    quiz_insights: {
        recent_scores: scores.map(s => ({ score: s, date: '' })), // Simplified
        weak_areas: [] 
    },
    exam: {
        workspace_id: workspace?.id || '',
        artifacts: artifacts
    }
  };
}
