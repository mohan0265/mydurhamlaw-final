-- Migration to add source tracking to voice_journals
BEGIN;

-- Add source_type and source_id columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'voice_journals'
      AND column_name = 'source_type'
  ) THEN
    ALTER TABLE public.voice_journals ADD COLUMN source_type TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'voice_journals'
      AND column_name = 'source_id'
  ) THEN
    ALTER TABLE public.voice_journals ADD COLUMN source_id TEXT;
  END IF;
END $$;

-- Add index for source tracking
CREATE INDEX IF NOT EXISTS idx_voice_journals_source ON public.voice_journals (source_type, source_id);

COMMIT;
