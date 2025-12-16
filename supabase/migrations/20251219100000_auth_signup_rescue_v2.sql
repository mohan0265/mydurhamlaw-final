-- 2025-12-19: Auth signup rescue v2
-- - Add auth_trigger_errors log table
-- - Harden handle_new_user and ensure_community_settings to never block OAuth signup
-- - Recreate triggers on auth.users to point at the safe functions
BEGIN;

-- Log table for trigger errors (idempotent)
CREATE TABLE IF NOT EXISTS public.auth_trigger_errors (
  id bigserial PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  trigger_name text,
  user_id uuid,
  email text,
  error_text text,
  detail text,
  hint text,
  context jsonb
);

-- Helper for logging trigger failures (no-op on error)
CREATE OR REPLACE FUNCTION public.log_auth_trigger_error(
  p_trigger text,
  p_user uuid,
  p_email text,
  p_error text,
  p_detail text DEFAULT NULL,
  p_hint text DEFAULT NULL,
  p_context jsonb DEFAULT NULL
) RETURNS void AS $$
BEGIN
  BEGIN
    INSERT INTO public.auth_trigger_errors(trigger_name, user_id, email, error_text, detail, hint, context)
    VALUES (p_trigger, p_user, p_email, p_error, p_detail, p_hint, p_context);
  EXCEPTION WHEN OTHERS THEN
    -- Never block caller
    NULL;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ensure community_settings table is present with safe defaults (idempotent)
CREATE TABLE IF NOT EXISTS public.community_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  allow_dm boolean DEFAULT true,
  show_presence boolean DEFAULT true,
  status text DEFAULT 'online',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Backfill and enforce defaults
UPDATE public.community_settings
  SET allow_dm = COALESCE(allow_dm, true),
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

-- Harden handle_new_user: never raise, log errors
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_year text;
  v_display text;
BEGIN
  v_year := COALESCE(NEW.raw_user_meta_data->>'year_group', 'year1');
  IF v_year NOT IN ('foundation','year1','year2','year3') THEN
    v_year := 'year1';
  END IF;

  v_display := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1),
    'User'
  );

  BEGIN
    INSERT INTO public.profiles (
      id,
      year_group,
      agreed_to_terms,
      display_name,
      avatar_url,
      created_via,
      profile_completed_at,
      last_updated_at
    ) VALUES (
      NEW.id,
      v_year,
      COALESCE((NEW.raw_user_meta_data->>'agreed_to_terms')::boolean, TRUE),
      v_display,
      COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
      COALESCE(NEW.raw_user_meta_data->>'created_via', 'auto'),
      NULL,
      now()
    );
  EXCEPTION
    WHEN unique_violation THEN
      NULL;
    WHEN OTHERS THEN
      PERFORM public.log_auth_trigger_error(
        'handle_new_user',
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

-- Harden ensure_community_settings: never raise, log errors
CREATE OR REPLACE FUNCTION public.ensure_community_settings()
RETURNS TRIGGER AS $$
DECLARE
  v_display text;
BEGIN
  -- If table missing, exit quietly
  IF to_regclass('public.community_settings') IS NULL THEN
    RETURN NEW;
  END IF;

  v_display := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1),
    'User'
  );

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

-- Recreate triggers to point to safe functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS trg_auth_user_after_insert_settings ON auth.users;
CREATE TRIGGER trg_auth_user_after_insert_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.ensure_community_settings();

COMMIT;
