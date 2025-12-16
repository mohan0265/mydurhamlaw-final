-- 2025-12-19: Auth signup rescue status patch v2
-- Make community_settings columns (status, created_at, updated_at) exist before backfilling.
BEGIN;

-- Ensure community_settings table exists minimally
CREATE TABLE IF NOT EXISTS public.community_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add missing columns safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='community_settings' AND column_name='allow_dm'
  ) THEN
    ALTER TABLE public.community_settings ADD COLUMN allow_dm boolean;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='community_settings' AND column_name='show_presence'
  ) THEN
    ALTER TABLE public.community_settings ADD COLUMN show_presence boolean;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='community_settings' AND column_name='status'
  ) THEN
    ALTER TABLE public.community_settings ADD COLUMN status text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='community_settings' AND column_name='created_at'
  ) THEN
    ALTER TABLE public.community_settings ADD COLUMN created_at timestamptz;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='community_settings' AND column_name='updated_at'
  ) THEN
    ALTER TABLE public.community_settings ADD COLUMN updated_at timestamptz;
  END IF;
END $$;

-- Backfill with defaults
UPDATE public.community_settings
SET
  allow_dm = COALESCE(allow_dm, true),
  show_presence = COALESCE(show_presence, true),
  status = COALESCE(status, 'online'),
  created_at = COALESCE(created_at, now()),
  updated_at = COALESCE(updated_at, now())
WHERE true;

-- Enforce defaults
ALTER TABLE public.community_settings
  ALTER COLUMN allow_dm SET DEFAULT true,
  ALTER COLUMN show_presence SET DEFAULT true,
  ALTER COLUMN status SET DEFAULT 'online',
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

COMMIT;
