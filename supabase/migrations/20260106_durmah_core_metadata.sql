-- Stage 1: Durmah Core - Database Enhancements
-- Date: 2026-01-06
-- Purpose: Add metadata columns for mode-aware threading and context storage

BEGIN;

-- Add metadata column to durmah_threads (for storing mode, assignment context, etc.)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='durmah_threads' AND column_name='metadata'
  ) THEN
    ALTER TABLE public.durmah_threads ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
    COMMENT ON COLUMN public.durmah_threads.metadata IS 'Mode-specific context: mode, assignmentId, loungeContext, etc.';
  END IF;
END $$;

-- Add metadata column to durmah_messages (for storing client context, page route, etc.)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='durmah_messages' AND column_name='metadata'
  ) THEN
    ALTER TABLE public.durmah_messages ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
    COMMENT ON COLUMN public.durmah_messages.metadata IS 'Client context: pageRoute, selectedText, assignmentProgress, etc.';
  END IF;
END $$;

-- Create index for faster mode-based queries
CREATE INDEX IF NOT EXISTS idx_durmah_threads_mode 
ON public.durmah_threads((metadata->>'mode'));

-- Create index for faster source-based message queries
CREATE INDEX IF NOT EXISTS idx_durmah_messages_source 
ON public.durmah_messages(source);

-- Add helpful comments
COMMENT ON TABLE public.durmah_threads IS 'Unified Durmah conversation threads - one per user with mode metadata';
COMMENT ON TABLE public.durmah_messages IS 'All Durmah messages across all modes with context metadata';

COMMIT;

-- Verification queries (for testing)
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'durmah_threads';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'durmah_messages';
