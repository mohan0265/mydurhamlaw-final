-- Migration: Create durmah_user_memory table for greeting suppression
-- Created: 2026-01-02
-- Purpose: Track last_seen_at for 6-hour greeting suppression

BEGIN;

-- Create table if not exists
CREATE TABLE IF NOT EXISTS public.durmah_user_memory (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen_at timestamptz,
  last_topic text,
  last_message text,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.durmah_user_memory ENABLE ROW LEVEL SECURITY;

-- Policies (idempotent)
DO $$
BEGIN
  -- Users can view their own memory
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'durmah_user_memory'
    AND policyname = 'Users can view own memory'
  ) THEN
    CREATE POLICY "Users can view own memory"
      ON public.durmah_user_memory
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  -- Users can insert their own memory
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'durmah_user_memory'
    AND policyname = 'Users can insert own memory'
  ) THEN
    CREATE POLICY "Users can insert own memory"
      ON public.durmah_user_memory
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Users can update their own memory
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'durmah_user_memory'
    AND policyname = 'Users can update own memory'
  ) THEN
    CREATE POLICY "Users can update own memory"
      ON public.durmah_user_memory
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

COMMIT;
