import { getSupabaseClient } from '@/lib/supabase/client';
import type { HelpLevel } from './humanMode';

export async function logProvenance(input: {
  userId: string;
  assignmentId?: string;
  assistanceLevel: HelpLevel;
  sources: Array<{title?: string; url?: string; cite?: string}>;
  modelUsed: string;
  tokensIn: number;
  tokensOut: number;
  aiDisclosureRequired: boolean;
  originalityScore?: number;
  notes?: string;
}) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error('Supabase client unavailable for provenance logging');
    return;
  }

  const { error } = await supabase.from('ai_provenance').insert({
    user_id: input.userId,
    assignment_id: input.assignmentId ?? null,
    assistance_level: input.assistanceLevel,
    sources: input.sources ?? [],
    model_used: input.modelUsed,
    tokens_in: input.tokensIn,
    tokens_out: input.tokensOut,
    ai_disclosure_required: input.aiDisclosureRequired,
    originality_score: input.originalityScore ?? null,
    notes: input.notes ?? null
  });
  if (error) console.error('provenance log error', error);
}

export async function getProvenance(userId: string, assignmentId?: string) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error('Supabase client unavailable for getting provenance');
    return null;
  }

  let query = supabase
    .from('ai_provenance')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (assignmentId) {
    query = query.eq('assignment_id', assignmentId);
  }
  
  const { data, error } = await query;
  if (error) {
    console.error('Error fetching provenance:', error);
    return null;
  }
  
  return data;
}