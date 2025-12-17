import { getApiAuth } from '@/lib/apiAuth';
import type { SupabaseClient } from '@supabase/supabase-js';

type DurmahContext = {
  userId: string;
  threadId: string;
  onboardingState: 'new' | 'onboarding' | 'active';
  lastSummary: string | null;
  recentMessages: { role: 'user' | 'assistant' | 'system'; content: string; source: string; created_at: string }[];
  profile: {
    displayName: string | null;
    yearGroup: string | null;
    trialStatus: 'trial' | 'inactive' | 'active';
    trialEndsAt: string | null;
  };
};

async function ensureThread(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('durmah_threads')
    .select('id, onboarding_state, last_summary, last_message_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (!error && data) return data;

  const nowIso = new Date().toISOString();
  const { data: inserted } = await supabase
    .from('durmah_threads')
    .upsert(
      {
        user_id: userId,
        onboarding_state: 'new',
        last_seen_at: nowIso,
        last_message_at: nowIso,
        last_summary: null,
      },
      { onConflict: 'user_id' }
    )
    .select('id, onboarding_state, last_summary, last_message_at')
    .single();

  return inserted!;
}

async function fetchProfile(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('display_name, year_group, created_at, trial_started_at, trial_ever_used')
    .eq('id', userId)
    .maybeSingle();

  const created = data?.trial_started_at || data?.created_at || null;
  let trialStatus: 'trial' | 'inactive' | 'active' = 'inactive';
  let trialEndsAt: string | null = null;
  if (created) {
    const start = new Date(created);
    const end = new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000);
    trialEndsAt = end.toISOString();
    if (new Date() < end && !data?.trial_ever_used) {
      trialStatus = 'trial';
    }
  }

  return {
    displayName: data?.display_name ?? null,
    yearGroup: data?.year_group ?? null,
    trialStatus,
    trialEndsAt,
  };
}

export async function buildDurmahContext(req: any): Promise<
  | { ok: false; status: 'unauthorized' | 'misconfigured' }
  | { ok: true; context: DurmahContext; supabase: SupabaseClient; userId: string }
> {
  const auth = await getApiAuth(req);
  if (auth.status === 'missing_token' || auth.status === 'invalid_token') {
    return { ok: false, status: 'unauthorized' };
  }
  if (auth.status === 'misconfigured') {
    return { ok: false, status: 'misconfigured' };
  }

  const { supabase, user } = auth;

  const thread = await ensureThread(supabase, user.id);

  const { data: messages } = await supabase
    .from('durmah_messages')
    .select('role, content, source, created_at')
    .eq('user_id', user.id)
    .eq('thread_id', thread.id)
    .order('created_at', { ascending: true })
    .limit(12);

  const profile = await fetchProfile(supabase, user.id);

  return {
    ok: true,
    supabase,
    userId: user.id,
    context: {
      userId: user.id,
      threadId: thread.id,
      onboardingState: (thread.onboarding_state as any) || 'new',
      lastSummary: thread.last_summary ?? null,
      recentMessages: messages || [],
      profile,
    },
  };
}
