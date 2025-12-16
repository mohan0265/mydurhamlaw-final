-- 2025-12-19: Catch-up to ensure profiles has durmah_voice_id
BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS durmah_voice_id TEXT DEFAULT 'warm_female';

-- Optional backfill to default where null
UPDATE public.profiles
  SET durmah_voice_id = 'warm_female'
  WHERE durmah_voice_id IS NULL;

COMMIT;
