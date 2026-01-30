-- Migration: Unified Chat Schema
-- Enhances durmah_messages to support all chat contexts (Lecture, Assignment, etc.)
-- Created: 2026-01-21

-- DATA PRESERVATION NOTE:
-- This migration DOES NOT delete 'lecture_chat_messages'. It remains for archival purposes.
-- New chats will be written to 'durmah_messages' with source='lecture'.

-- 1. Add new columns to durmah_messages
DO $$
BEGIN
    -- context: Store arbitrary JSON metadata (lectureId, assignmentId, etc.)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'durmah_messages' AND column_name = 'context') THEN
        ALTER TABLE public.durmah_messages ADD COLUMN context JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- modality: 'text' or 'voice'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'durmah_messages' AND column_name = 'modality') THEN
        ALTER TABLE public.durmah_messages ADD COLUMN modality TEXT DEFAULT 'text';
    END IF;

    -- source: 'widget', 'lecture', 'assignment', 'wellbeing', etc.
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'durmah_messages' AND column_name = 'source') THEN
        ALTER TABLE public.durmah_messages ADD COLUMN source TEXT DEFAULT 'widget';
    END IF;

    -- scope: 'global', 'lecture', 'assignment', 'thread'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'durmah_messages' AND column_name = 'scope') THEN
        ALTER TABLE public.durmah_messages ADD COLUMN scope TEXT DEFAULT 'global';
    END IF;

    -- visibility: 'ephemeral' (default) or 'saved' (user explicitly kept)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'durmah_messages' AND column_name = 'visibility') THEN
        ALTER TABLE public.durmah_messages ADD COLUMN visibility TEXT DEFAULT 'ephemeral';
    END IF;

    -- conversation_id: Deterministic UUID for threading (e.g. hash of user+lecture)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'durmah_messages' AND column_name = 'conversation_id') THEN
        ALTER TABLE public.durmah_messages ADD COLUMN conversation_id UUID;
    END IF;
END $$;

-- 2. Loosen constraint on session_id (legacy field)
-- We rely on conversation_id for threading now.
ALTER TABLE public.durmah_messages ALTER COLUMN session_id DROP NOT NULL;

-- 3. Add Indexes for new retrieval patterns
CREATE INDEX IF NOT EXISTS idx_durmah_messages_conversation_id ON public.durmah_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_durmah_messages_scope ON public.durmah_messages(scope);
CREATE INDEX IF NOT EXISTS idx_durmah_messages_visibility ON public.durmah_messages(visibility);
CREATE INDEX IF NOT EXISTS idx_durmah_messages_source ON public.durmah_messages(source);

-- 4. Ensure RLS policies cover the updates
-- (Existing policies on durmah_messages usually cover "ALL" or "SELECT/INSERT" based on user_id, 
-- but lets verify we don't need column-specific policies. Standard RLS is row-based, so we are good).

-- 5. Helper function to find "Global Tail" messages easily
-- (Optional, but useful for performance if table grows large)
CREATE OR REPLACE FUNCTION get_global_chat_tail(p_user_id UUID, p_limit INT DEFAULT 10)
RETURNS SETOF public.durmah_messages
LANGUAGE sql
STABLE
AS $$
  SELECT * FROM public.durmah_messages
  WHERE user_id = p_user_id
  AND scope = 'global'
  ORDER BY created_at DESC
  LIMIT p_limit;
$$;
