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
};
