-- Update voice_journals table structure to store session metadata and transcripts
BEGIN;

-- Drop obsolete constraints if they exist
ALTER TABLE public.voice_journals
  DROP CONSTRAINT IF EXISTS voice_journals_transcript_not_empty,
  DROP CONSTRAINT IF EXISTS voice_journals_response_not_empty,
  DROP CONSTRAINT IF EXISTS voice_journals_duration_positive;

-- Backfill new columns only if they do not already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'voice_journals'
      AND column_name = 'session_id'
  ) THEN
    ALTER TABLE public.voice_journals
      ADD COLUMN session_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'voice_journals'
      AND column_name = 'started_at'
  ) THEN
    ALTER TABLE public.voice_journals
      ADD COLUMN started_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'voice_journals'
      AND column_name = 'ended_at'
  ) THEN
    ALTER TABLE public.voice_journals
      ADD COLUMN ended_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'voice_journals'
      AND column_name = 'duration_seconds'
  ) THEN
    ALTER TABLE public.voice_journals
      ADD COLUMN duration_seconds INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'voice_journals'
      AND column_name = 'topic'
  ) THEN
    ALTER TABLE public.voice_journals
      ADD COLUMN topic TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'voice_journals'
      AND column_name = 'summary'
  ) THEN
    ALTER TABLE public.voice_journals
      ADD COLUMN summary TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'voice_journals'
      AND column_name = 'transcript_json'
  ) THEN
    ALTER TABLE public.voice_journals
      ADD COLUMN transcript_json JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Backfill new metadata from existing columns where possible
UPDATE public.voice_journals
SET
  session_id = COALESCE(session_id, gen_random_uuid()::text),
  started_at = COALESCE(started_at, created_at),
  ended_at = COALESCE(ended_at, created_at),
  duration_seconds = COALESCE(duration_seconds, session_duration, 0),
  transcript_json =
    CASE
      WHEN (transcript_json IS NULL OR jsonb_array_length(transcript_json) = 0)
        AND (transcript IS NOT NULL OR gpt_response IS NOT NULL)
      THEN jsonb_build_array(
        jsonb_build_object('role', 'you', 'text', COALESCE(transcript, '')),
        jsonb_build_object('role', 'durmah', 'text', COALESCE(gpt_response, ''))
      )
      ELSE COALESCE(transcript_json, '[]'::jsonb)
    END,
  topic = COALESCE(topic,
    CASE
      WHEN transcript IS NOT NULL AND LENGTH(transcript) > 0
        THEN substring(transcript from 1 for 60)
      ELSE 'Durmah Voice Session'
    END
  );

-- Remove legacy columns now that data has been migrated
ALTER TABLE public.voice_journals
  DROP COLUMN IF EXISTS transcript,
  DROP COLUMN IF EXISTS gpt_response,
  DROP COLUMN IF EXISTS session_duration;

-- Rename JSON column to transcript (final schema)
ALTER TABLE public.voice_journals
  RENAME COLUMN transcript_json TO transcript;

-- Ensure required defaults / constraints
ALTER TABLE public.voice_journals
  ALTER COLUMN transcript SET DEFAULT '[]'::jsonb,
  ALTER COLUMN transcript SET NOT NULL,
  ALTER COLUMN duration_seconds SET DEFAULT 0,
  ADD CONSTRAINT voice_journals_duration_positive CHECK (duration_seconds >= 0);

COMMIT;
