-- Migration: Durmah Interest Events Tracking
-- Created: 2026-01-17
-- Purpose: Track student interest in news articles for context-aware assignment support

-- =====================================================
-- TABLE: durmah_interest_events
-- =====================================================
CREATE TABLE IF NOT EXISTS public.durmah_interest_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'news_ai_analysis_clicked', etc.
  source TEXT NOT NULL, -- 'legal_news', 'community', etc.
  title TEXT,
  url TEXT,
  snippet TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_durmah_interest_events_user_id 
  ON public.durmah_interest_events(user_id);
  
CREATE INDEX IF NOT EXISTS idx_durmah_interest_events_created_at 
  ON public.durmah_interest_events(created_at DESC);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.durmah_interest_events ENABLE ROW LEVEL SECURITY;

-- Users can insert their own interest events
CREATE POLICY "Users can insert their own interest events"
  ON public.durmah_interest_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can select their own interest events
CREATE POLICY "Users can select their own interest events"
  ON public.durmah_interest_events FOR SELECT
  USING (auth.uid() = user_id);

-- Service role has full access (automatically handled by Supabase)
