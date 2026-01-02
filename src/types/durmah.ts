export type DurmahTerm = 'Michaelmas' | 'Epiphany' | 'Easter' | 'Vacation' | 'Unknown';

export type DurmahTimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export type DurmahContextPacket = {
  userId: string;
  threadId: string | null;
  onboardingState: 'new' | 'onboarding' | 'active';
  lastSummary: string | null;
  recentMessages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    source?: string;
    created_at: string;
  }>;
  profile: {
    displayName: string | null;
    yearGroup: string | null;
    yearOfStudy: string | null;
    role: string;
    trialStatus?: string | null;
    trialEndsAt?: string | null;
  };
  academic: {
    term: DurmahTerm;
    weekOfTerm: number | null;
    dayOfTerm: number | null;
    dayLabel: string;
    timezone: string;
    localTimeISO: string;
    timeOfDay: DurmahTimeOfDay;
    academicYearLabel: string;
    yearAtAGlanceAvailable?: boolean;
    yearAtAGlanceUrl?: string;
  };
  continuity: {
    lastUserIntent: string | null;
    lastAssistantSuggestion: string | null;
    followUpQuestion: string | null;
    lastRecommendations: Array<{ title: string; url?: string; note?: string }>;
    openTodos: Array<{ text: string; createdAt?: string }>;
  };
  recent: {
    lastMessages: Array<{
      role: 'user' | 'assistant';
      content: string;
      created_at: string;
    }>;
  };
  schedule?: {
    nextClass: { title: string; start: string; end: string; location?: string; label: string } | null;
    today: Array<{ title: string; start: string; end: string; location?: string; label: string }>;
    weekPreview: Array<{ title: string; start: string; end: string; location?: string; label: string }>;
    nextClassLabel: string | null;
    todayLabels: string[];
    weekPreviewLabels: string[];
  };
  academicCalendar?: {
    currentYear: string;
    terms: Array<{ term: DurmahTerm; start: string; end: string }>;
  };
  memory?: {
    last_seen_at: string | null;
    greetingSuppressed: boolean;
  };
};

