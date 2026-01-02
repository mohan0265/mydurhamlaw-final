import { getApiAuth } from '@/lib/apiAuth';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DurmahContextPacket, DurmahTerm, DurmahTimeOfDay } from '@/types/durmah';

const DEFAULT_TIMEZONE = 'Europe/London';

const DURHAM_TERM_CALENDAR_2025_26: Array<{ term: DurmahTerm; start: string; end: string }> = [
  { term: 'Michaelmas', start: '2025-10-06', end: '2025-12-12' },
  { term: 'Epiphany', start: '2026-01-12', end: '2026-03-20' },
  { term: 'Easter', start: '2026-04-27', end: '2026-06-19' },
];

function toUtcDateFromYmd(ymd: string) {
  const [year, month, day] = ymd.split('-').map((part) => Number(part));
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
}

function getZonedParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      map[part.type] = part.value;
    }
  }
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

function computeTimeOfDay(hour: number): DurmahTimeOfDay {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

function computeAcademicContext(timeZone: string) {
  const now = new Date();
  const parts = getZonedParts(now, timeZone);
  const localDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  const localTimeISO = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
  ).toISOString();

  let term: DurmahTerm = 'Unknown';
  let weekOfTerm: number | null = null;
  let dayOfTerm: number | null = null;

  for (const window of DURHAM_TERM_CALENDAR_2025_26) {
    const start = toUtcDateFromYmd(window.start);
    const end = toUtcDateFromYmd(window.end);
    if (localDate >= start && localDate <= end) {
      term = window.term;
      const diffMs = localDate.getTime() - start.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      dayOfTerm = diffDays + 1;
      weekOfTerm = Math.floor(diffDays / 7) + 1;
      break;
    }
  }

  if (term === 'Unknown') {
    term = 'Vacation';
  }

  const dayLabel = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'short',
  }).format(now);
  const timeOfDay = computeTimeOfDay(parts.hour);
  const startYear = parts.month >= 9 ? parts.year : parts.year - 1;
  const endYear = parts.month >= 9 ? parts.year + 1 : parts.year;
  const academicYearLabel = `${startYear}/${String(endYear).slice(-2)}`;

  return {
    term,
    weekOfTerm,
    dayOfTerm,
    dayLabel,
    timezone: timeZone,
    localTimeISO,
    timeOfDay,
    academicYearLabel,
  };
}

function summarizeText(text: string, maxLen = 140) {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (!trimmed) return '';
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 3)}...`;
}

function extractRecommendations(text: string) {
  const urls = text.match(/https?:\/\/[^\s)]+/g) || [];
  return urls.slice(0, 3).map((url) => {
    let title = url;
    try {
      const parsed = new URL(url);
      title = parsed.hostname.replace(/^www\./, '');
    } catch {
      // Keep raw url as title
    }
    return { title, url };
  });
}

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
    yearOfStudy: data?.year_group ?? null,
    trialStatus,
    trialEndsAt,
    role: 'student',
  };
}

export async function buildDurmahContext(req: any): Promise<
  | { ok: false; status: 'unauthorized' | 'misconfigured' }
  | { ok: true; context: DurmahContextPacket; supabase: SupabaseClient; userId: string }
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
  const academic = computeAcademicContext(DEFAULT_TIMEZONE);

  // Fetch timetable events (next 10 upcoming events within next 14 days)
  const now = new Date();
  const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const { data: timetableEvents } = await supabase
    .from('timetable_events')
    .select('title, start_time, end_time, location, module_code')
    .eq('user_id', user.id)
    .gte('start_time', now.toISOString())
    .lte('start_time', twoWeeksFromNow.toISOString())
    .order('start_time', { ascending: true })
    .limit(10);

  // Build schedule summary with Durham timezone formatting
  const schedule = timetableEvents ? (() => {
    const timezone = academic.timezone || DEFAULT_TIMEZONE;
    
    // Helper to format time in Durham timezone
    const formatTime = (isoString: string) => {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(date);
    };

    const formatDayTime = (isoString: string) => {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: timezone,
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(date);
    };

    const nextClass = timetableEvents[0] ? {
      title: timetableEvents[0].title,
      start: timetableEvents[0].start_time,
      end: timetableEvents[0].end_time,
      location: timetableEvents[0].location || undefined,
      label: `${timetableEvents[0].title} • ${formatDayTime(timetableEvents[0].start_time)}${timetableEvents[0].location ? ` • ${timetableEvents[0].location}` : ''}`,
    } : null;

    const today = timetableEvents.filter(e => {
      const eventDate = new Date(e.start_time);
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
      return eventDate >= todayStart && eventDate < todayEnd;
    }).map(e => ({
      title: e.title,
      start: e.start_time,
      end: e.end_time,
      location: e.location || undefined,
      label: `${e.title} • ${formatTime(e.start_time)}${e.location ? ` • ${e.location}` : ''}`,
    }));

    const weekPreview = timetableEvents.slice(0, 6).map(e => ({
      title: e.title,
      start: e.start_time,
      end: e.end_time,
      location: e.location || undefined,
      label: `${e.title} • ${formatDayTime(e.start_time)}${e.location ? ` • ${e.location}` : ''}`,
    }));

    return {
      nextClass,
      today,
      weekPreview,
      nextClassLabel: nextClass?.label || null,
      todayLabels: today.map(t => t.label),
      weekPreviewLabels: weekPreview.map(w => w.label),
    };
  })() : undefined;


  const recentMessages = messages || [];
  const lastUser = [...recentMessages].reverse().find((m) => m.role === 'user');
  const lastAssistant = [...recentMessages].reverse().find((m) => m.role === 'assistant');
  const lastUserIntent = lastUser ? summarizeText(lastUser.content) : null;
  const lastAssistantSuggestion = lastAssistant ? summarizeText(lastAssistant.content) : null;
  const lastRecommendations = lastAssistant ? extractRecommendations(lastAssistant.content) : [];
  const followUpQuestion = lastUserIntent
    ? `Want to continue from where we left off on ${lastUserIntent}?`
    : null;

  const lastMessagesSnippet = recentMessages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-8)
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
      created_at: m.created_at,
    }));

  return {
    ok: true,
    supabase,
    userId: user.id,
    context: {
      userId: user.id,
      threadId: thread.id,
      onboardingState: (thread.onboarding_state as any) || 'new',
      lastSummary: thread.last_summary ?? null,
      recentMessages,
      profile,
      academic,
      continuity: {
        lastUserIntent,
        lastAssistantSuggestion,
        followUpQuestion,
        lastRecommendations,
        openTodos: [],
      },
      recent: {
        lastMessages: lastMessagesSnippet,
      },
      schedule,
    },
    academicCalendar: {
      currentYear: '2025/26',
      terms: DURHAM_TERM_CALENDAR_2025_26,
    },
  };
}
