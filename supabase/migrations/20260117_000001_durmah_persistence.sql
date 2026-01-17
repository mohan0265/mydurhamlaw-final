-- Migration: Durmah Session Persistence & Context Awareness
-- Created: 2026-01-17
-- Purpose: Enable Durmah to remember conversations across sessions

-- =====================================================
-- TABLE 1: durmah_sessions
-- =====================================================
CREATE TABLE IF NOT EXISTS public.durmah_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  mode TEXT NOT NULL CHECK (mode IN ('voice', 'text')),
  title TEXT,
  last_summary_id UUID,
  CONSTRAINT fk_last_summary FOREIGN KEY (last_summary_id) REFERENCES public.durmah_summaries(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_durmah_sessions_user_id ON public.durmah_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_durmah_sessions_last_active ON public.durmah_sessions(last_active_at DESC);

-- =====================================================
-- TABLE 2: durmah_messages
-- =====================================================
CREATE TABLE IF NOT EXISTS public.durmah_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.durmah_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  meta JSONB
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_durmah_messages_session_id ON public.durmah_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_durmah_messages_user_id ON public.durmah_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_durmah_messages_created_at ON public.durmah_messages(created_at DESC);

-- =====================================================
-- TABLE 3: durmah_summaries
-- =====================================================
CREATE TABLE IF NOT EXISTS public.durmah_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.durmah_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  token_estimate INT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_durmah_summaries_session_id ON public.durmah_summaries(session_id);
CREATE INDEX IF NOT EXISTS idx_durmah_summaries_user_id ON public.durmah_summaries(user_id);

-- Fix circular dependency by adding FK constraint AFTER durmah_summaries exists
-- (Already defined above in CREATE TABLE, but adding as separate ALTER if needed)

-- =====================================================
-- TABLE 4: legal_news_cache
-- =====================================================
CREATE TABLE IF NOT EXISTS public.legal_news_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- items structure: [{ title, source, url, published_at, tags }]
  CONSTRAINT single_cache_row CHECK (id = '00000000-0000-0000-0000-000000000001'::uuid)
);

-- Insert initial row (singleton pattern)
INSERT INTO public.legal_news_cache (id, items) 
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- TABLE 5: community_cache
-- =====================================================
CREATE TABLE IF NOT EXISTS public.community_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- items structure: [{ title, category, date_range, location, url, short_desc }]
  CONSTRAINT single_cache_row CHECK (id = '00000000-0000-0000-0000-000000000002'::uuid)
);

-- Insert initial row (singleton pattern)
INSERT INTO public.community_cache (id, items)
VALUES ('00000000-0000-0000-0000-000000000002'::uuid, '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.durmah_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.durmah_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.durmah_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_news_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_cache ENABLE ROW LEVEL SECURITY;

-- durmah_sessions policies
CREATE POLICY "Users can view their own sessions"
  ON public.durmah_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
  ON public.durmah_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.durmah_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- durmah_messages policies
CREATE POLICY "Users can view their own messages"
  ON public.durmah_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own messages"
  ON public.durmah_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- durmah_summaries policies
CREATE POLICY "Users can view their own summaries"
  ON public.durmah_summaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own summaries"
  ON public.durmah_summaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own summaries"
  ON public.durmah_summaries FOR UPDATE
  USING (auth.uid() = user_id);

-- Cache tables: Read-only for authenticated users
CREATE POLICY "Authenticated users can view legal news cache"
  ON public.legal_news_cache FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view community cache"
  ON public.community_cache FOR SELECT
  TO authenticated
  USING (true);

-- Service role can do everything (no RLS restrictions for service_role)
-- This is handled automatically by Supabase

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get or create active session for user
CREATE OR REPLACE FUNCTION public.get_or_create_durmah_session(
  p_user_id UUID,
  p_mode TEXT DEFAULT 'voice'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id UUID;
BEGIN
  -- Try to find the most recent active session (< 24h old)
  SELECT id INTO v_session_id
  FROM public.durmah_sessions
  WHERE user_id = p_user_id
    AND mode = p_mode
    AND last_active_at > NOW() - INTERVAL '24 hours'
  ORDER BY last_active_at DESC
  LIMIT 1;

  -- If no recent session found, create new one
  IF v_session_id IS NULL THEN
    INSERT INTO public.durmah_sessions (user_id, mode, title)
    VALUES (p_user_id, p_mode, 'Session ' || TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI'))
    RETURNING id INTO v_session_id;
  END IF;

  RETURN v_session_id;
END;
$$;

-- Function to update session activity timestamp
CREATE OR REPLACE FUNCTION public.touch_durmah_session(p_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.durmah_sessions
  SET last_active_at = NOW()
  WHERE id = p_session_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_or_create_durmah_session TO authenticated;
GRANT EXECUTE ON FUNCTION public.touch_durmah_session TO authenticated;
