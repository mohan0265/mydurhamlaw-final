-- Migration: Create Interest Events Table for Durmah Memory
-- Purpose: Track student interactions with news, lectures, assignments for personalization

-- Interest Events Table: Tracks what students engage with
CREATE TABLE IF NOT EXISTS public.durmah_interest_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN (
    'news_ai_analysis_clicked',
    'news_ai_analysis_completed',
    'lecture_analyzed',
    'assignment_opened',
    'guide_viewed'
  )),
  source text NOT NULL DEFAULT 'legal_news', -- 'legal_news', 'lectures', 'assignments', 'onboarding'
  title text,
  url text,
  snippet text,
  tags text[],
  metadata jsonb DEFAULT '{}'::jsonb, -- Flexible for future use
  created_at timestamptz DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_interest_events_user_id 
  ON public.durmah_interest_events(user_id);

CREATE INDEX IF NOT EXISTS idx_interest_events_type 
  ON public.durmah_interest_events(event_type);

CREATE INDEX IF NOT EXISTS idx_interest_events_created_at 
  ON public.durmah_interest_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_interest_events_user_type 
  ON public.durmah_interest_events(user_id, event_type);

-- RLS Policies
ALTER TABLE public.durmah_interest_events ENABLE ROW LEVEL SECURITY;

-- Users can only see their own events
CREATE POLICY "Users can view own interest events"
  ON public.durmah_interest_events FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own events
CREATE POLICY "Users can insert own interest events"
  ON public.durmah_interest_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Optional: Allow deletion of own events (e.g., privacy/GDPR)
CREATE POLICY "Users can delete own interest events"
  ON public.durmah_interest_events FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.durmah_interest_events IS 'Tracks student interactions with news, lectures, assignments for personalization';
COMMENT ON COLUMN public.durmah_interest_events.event_type IS 'Type of interaction (e.g., news_ai_analysis_clicked)';
COMMENT ON COLUMN public.durmah_interest_events.source IS 'Where the event originated (legal_news, lectures, etc.)';
COMMENT ON COLUMN public.durmah_interest_events.metadata IS 'Flexible JSON for future event-specific data';
