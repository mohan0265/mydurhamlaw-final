export type DurmahTerm =
  | "Michaelmas"
  | "Epiphany"
  | "Easter"
  | "Vacation"
  | "Unknown";

export type DurmahTimeOfDay = "morning" | "afternoon" | "evening" | "night";

export type DurmahMode =
  | "general"
  | "assignment"
  | "lounge"
  | "support"
  | "planner"
  | "awy"
  | "quiz";

export type DurmahContextPacket = {
  userId: string;
  threadId: string | null;
  onboardingState: "new" | "onboarding" | "active";
  lastSummary: string | null;
  recentMessages: Array<{
    role: "user" | "assistant" | "system";
    content: string;
    source?: string;
    created_at: string;
  }>;
  profile: {
    displayName: string | null;
    display_name?: string | null; // Support DB fallback
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
      role: "user" | "assistant";
      content: string;
      created_at: string;
    }>;
  };
  schedule?: {
    nextClass: {
      title: string;
      start: string;
      end: string;
      location?: string;
      label: string;
    } | null;
    today: Array<{
      title: string;
      start: string;
      end: string;
      location?: string;
      label: string;
    }>;
    weekPreview: Array<{
      title: string;
      start: string;
      end: string;
      location?: string;
      label: string;
    }>;
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
  profileCompleteness?: {
    isComplete: boolean;
    missingFields: string[];
  };
  timetableMeta?: {
    hasEvents: boolean;
    dataSource: "dev-seed" | "user" | "none";
    isVerified: boolean;
    verificationUrl: string;
  };

  // NEW: Assignment awareness from AW tables
  assignments?: {
    active: Array<{
      id: string;
      title: string;
      module: string;
      status: string;
      currentStage?: string;
      nextStep?: string;
      dueDate?: string;
      progress?: number;
    }>;
    recentlyCompleted: Array<{
      id: string;
      title: string;
      module: string;
      completedAt: string;
    }>;
    overdue: Array<{
      id: string;
      title: string;
      module: string;
      daysOver: number;
    }>;
    total: number;
  };

  // NEW: AWY presence (if connected loved ones exist)
  awy?: {
    lovedOnes: Array<{
      id: string;
      name: string;
      relation: string;
      status: "online" | "away" | "offline";
      lastSeen: string | null;
      isAvailable: boolean;
    }>;
    hasConnections: boolean;
  };

  // NEW: Mode-specific context
  modeContext?: {
    mode: DurmahMode;
    assignmentId?: string;
    lectureId?: string;
    topicId?: string;
    quizSessionId?: string;
    relevantData?: any;
  };

  // Lectures metadata only for global context (content fetched on-demand via tool)
  lectures?: {
    recent: Array<{
      id: string;
      title: string;
      module_code?: string;
      module_name?: string;
      lecturer_name?: string;
      lecture_date?: string;
      status: string;
    }>;
    current?: {
      id: string;
      title: string;
      module_code?: string;
      module_name?: string;
      lecturer_name?: string;
      lecture_date?: string;
      summary?: string;
      key_points?: string[];
      engagement_hooks?: string[];
      transcript_snippet?: string;
    };
    total: number;
  };
};
