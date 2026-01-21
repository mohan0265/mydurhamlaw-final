// Types for Durmah Session Persistence

export interface DurmahSession {
  id: string;
  user_id: string;
  created_at: string;
  last_active_at: string;
  mode: 'voice' | 'text';
  tags: string[] | null;
  title: string | null;
  last_summary_id: string | null;
}

// Interest Events (for tracking student engagement with content)
export interface DurmahInterestEvent {
  id: string;
  user_id: string;
  event_type: string;
  source: string;
  title: string | null;
  url: string | null;
  snippet: string | null;
  tags: string[] | null;
  created_at: string;
}

export interface NewsAnalysisRequest {
  title: string;
  source: string;
  url: string;
  snippet?: string;
  tags?: string[];
}

export interface DurmahMessage {
  id: string;
  session_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  meta?: Record<string, any>;
}

export interface DurmahSummary {
  id: string;
  session_id: string;
  user_id: string;
  summary: string;
  created_at: string;
  token_estimate?: number;
}

export interface LegalNewsCacheItem {
  title: string;
  source: string;
  url: string;
  published_at: string;
  tags?: string[];
}

export interface LegalNewsCache {
  id: string;
  fetched_at: string;
  items: LegalNewsCacheItem[];
}

export interface CommunityCacheItem {
  title: string;
  category: string;
  date_range?: string;
  location?: string;
  url?: string;
  short_desc: string;
}

export interface CommunityCache {
  id: string;
  fetched_at: string;
  items: CommunityCacheItem[];
}

// API Response Types

export interface DurmahHistoryResponse {
  latest_session: DurmahSession | null;
  last_summary: DurmahSummary | null;
  last_messages: DurmahMessage[];
  recent_interests?: any[];
  context_loaded: boolean;
}

export interface DurmahContextPacket {
  user_profile: {
    name?: string;
    year_group?: string;
  };
  current_timestamp: string;
  app_context: {
    page?: string;
    module?: string;
    assignment?: string;
  };
  last_summary?: string;
  last_messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  latest_legal_news_brief?: Array<{
    title: string;
    date: string;
    relevance?: string;
  }>;
  latest_community_brief?: Array<{
    title: string;
    date: string;
  }>;
}
