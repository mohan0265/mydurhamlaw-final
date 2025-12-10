// src/lib/durmah/service.ts
import { getServerSupabaseClient } from '@/lib/supabase/serverClient';

export type StudentContext = {
  userId: string | null;
  name: string | null;
  yearOfStudy: string | null;
  upcoming: Array<{ title: string; dueAt: string }>;
  lastMemory: { last_seen_at: string; last_topic: string | null; last_message: string | null } | null;
};

const EMPTY_CONTEXT: StudentContext = {
  userId: null,
  name: null,
  yearOfStudy: null,
  upcoming: [],
  lastMemory: null,
};

export async function getStudentContext(): Promise<StudentContext> {
  const supabase = getServerSupabaseClient();
  if (!supabase) {
    return { ...EMPTY_CONTEXT };
  }

  let userId: string | null = null;
  try {
    const { data: session } = await supabase.auth.getSession();
    userId = session?.session?.user?.id ?? null;
  } catch {
    userId = null;
  }

  let name: string | null = null;
  let year: string | null = null;
  if (userId) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('display_name, year_of_study')
        .eq('id', userId)
        .maybeSingle();
      name = data?.display_name ?? null;
      year = data?.year_of_study ?? null;
    } catch {
      name = null;
      year = null;
    }
  }

  const upcoming: Array<{ title: string; dueAt: string }> = [];
  if (userId) {
    try {
      const nowIso = new Date().toISOString();
      let query = await supabase
        .from('assignments')
        .select('title, due_at')
        .gte('due_at', nowIso)
        .order('due_at', { ascending: true })
        .limit(3);

      const needsFallback = Boolean(query?.error && query.error.message?.includes('relation'))
        || query?.error?.code === 'PGRST116';

      if (needsFallback) {
        query = await supabase
          .from('tasks')
          .select('title, due_at')
          .gte('due_at', nowIso)
          .order('due_at', { ascending: true })
          .limit(3);
      }

      if (query?.data) {
        for (const item of query.data) {
          if (item?.title && item?.due_at) {
            upcoming.push({ title: item.title, dueAt: item.due_at });
          }
        }
      }
    } catch {
      upcoming.length = 0;
    }
  }

  let lastMemory: StudentContext['lastMemory'] = null;
  if (userId) {
    try {
      const { data } = await supabase
        .from('durmah_memory')
        .select('last_seen_at, last_topic, last_message')
        .eq('user_id', userId)
        .order('last_seen_at', { ascending: false })
        .limit(1);
      lastMemory = data?.[0] ?? null;
    } catch {
      lastMemory = null;
    }
  }

  return {
    userId,
    name,
    yearOfStudy: year,
    upcoming,
    lastMemory,
  };
}

export function composeOpener(ctx: StudentContext): string {
  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const who = ctx.name || 'there';
  const year = ctx.yearOfStudy ? ` • Year ${ctx.yearOfStudy}` : '';
  const deadline = ctx.upcoming[0];

  const nudge = deadline
    ? `Heads-up: “${deadline.title}” is due ${new Date(deadline.dueAt).toLocaleDateString()}. Want to plan the next step together?`
    : `Want to pick up where we left off${ctx.lastMemory?.last_topic ? ` on “${ctx.lastMemory.last_topic}”` : ''}?`;

  return `${hello}, ${who}${year}! I’m here with you. ${nudge}`;
}
