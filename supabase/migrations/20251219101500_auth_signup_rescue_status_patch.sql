-- 2025-12-19: Auth signup rescue status patch
-- Some environments have community_settings without a status column. This patch adds it safely
-- and recreates the ensure_community_settings function to avoid missing-column errors.
BEGIN;

-- Ensure community_settings table exists (minimal shape)
CREATE TABLE IF NOT EXISTS public.community_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  allow_dm boolean DEFAULT true,
  show_presence boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add status column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_settings' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.community_settings ADD COLUMN status text;
  END IF;
END $$;

-- Backfill and enforce defaults (idempotent even if column already existed)
UPDATE public.community_settings
SET
  allow_dm = COALESCE(allow_dm, true),
  show_presence = COALESCE(show_presence, true),
  status = COALESCE(status, 'online'),
  updated_at = COALESCE(updated_at, now()),
  created_at = COALESCE(created_at, now())
WHERE true;

ALTER TABLE public.community_settings
  ALTER COLUMN allow_dm SET DEFAULT true,
  ALTER COLUMN show_presence SET DEFAULT true,
  ALTER COLUMN status SET DEFAULT 'online',
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

-- Recreate ensure_community_settings defensively (assumes status now exists)
CREATE OR REPLACE FUNCTION public.ensure_community_settings()
RETURNS TRIGGER AS $$
BEGIN
  IF to_regclass('public.community_settings') IS NULL THEN
    RETURN NEW;
  END IF;

  BEGIN
    INSERT INTO public.community_settings (user_id, allow_dm, show_presence, status, created_at, updated_at)
    VALUES (NEW.id, true, true, 'online', now(), now())
    ON CONFLICT (user_id) DO UPDATE
      SET updated_at = EXCLUDED.updated_at;
  EXCEPTION
    WHEN unique_violation THEN
      NULL;
    WHEN OTHERS THEN
      PERFORM public.log_auth_trigger_error(
        'ensure_community_settings',
        NEW.id,
        NEW.email,
        SQLERRM,
        PG_EXCEPTION_DETAIL,
        PG_EXCEPTION_HINT,
        to_jsonb(NEW)
      );
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate trigger to point to the updated function
DROP TRIGGER IF EXISTS trg_auth_user_after_insert_settings ON auth.users;
CREATE TRIGGER trg_auth_user_after_insert_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.ensure_community_settings();

COMMIT;
