-- Migration: Create timetable_events table (idempotent)
-- Created: 2026-01-02

BEGIN;

-- Create table if not exists
CREATE TABLE IF NOT EXISTS public.timetable_events (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  location text,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create index on user_id and start_time for efficient queries
CREATE INDEX IF NOT EXISTS idx_timetable_events_user_start 
  ON public.timetable_events(user_id, start_time);

-- Enable RLS
ALTER TABLE public.timetable_events ENABLE ROW LEVEL SECURITY;

-- Policies (idempotent with exception handling)
DO $$ 
BEGIN
  -- Policy: Users can view their own timetable events
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'timetable_events' 
    AND policyname = 'Users can view own timetable events'
  ) THEN
    CREATE POLICY "Users can view own timetable events"
      ON public.timetable_events
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  -- Policy: Users can insert their own timetable events
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'timetable_events' 
    AND policyname = 'Users can insert own timetable events'
  ) THEN
    CREATE POLICY "Users can insert own timetable events"
      ON public.timetable_events
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Policy: Users can update their own timetable events
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'timetable_events' 
    AND policyname = 'Users can update own timetable events'
  ) THEN
    CREATE POLICY "Users can update own timetable events"
      ON public.timetable_events
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Policy: Users can delete their own timetable events
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'timetable_events' 
    AND policyname = 'Users can delete own timetable events'
  ) THEN
    CREATE POLICY "Users can delete own timetable events"
      ON public.timetable_events
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;

EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Ignore if policies already exist
END $$;

COMMIT;
