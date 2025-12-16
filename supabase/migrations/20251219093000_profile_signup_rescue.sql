-- 2025-12-19: Harden profile creation during OAuth to prevent "Database error saving new user"
BEGIN;

-- Ensure profiles.year_group has a safe default and no NULLs
ALTER TABLE public.profiles
  ALTER COLUMN year_group SET DEFAULT 'year1';

UPDATE public.profiles
  SET year_group = 'year1'
  WHERE year_group IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN year_group SET NOT NULL;

-- Reinstate handle_new_user as a safe, idempotent profile creator with defaults
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_year text;
  v_display text;
BEGIN
  -- Derive defaults defensively
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
      NOW()
    );
  EXCEPTION
    WHEN unique_violation THEN
      -- Profile already exists; ignore
      NULL;
    WHEN OTHERS THEN
      -- Log but never block auth user creation
      RAISE LOG 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger is in place
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMIT;
