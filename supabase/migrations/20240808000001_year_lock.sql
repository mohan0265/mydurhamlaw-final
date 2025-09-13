-- Add year lock columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS academic_year TEXT CHECK (academic_year IN ('foundation','year_1','year_2','year_3')),
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS can_preview_years BOOLEAN NOT NULL DEFAULT true;

-- Set default trial period (30 days from now) for existing users
UPDATE public.profiles 
SET trial_ends_at = NOW() + INTERVAL '30 days'
WHERE trial_ends_at IS NULL;

-- Make trial_ends_at NOT NULL after setting defaults
ALTER TABLE public.profiles 
ALTER COLUMN trial_ends_at SET NOT NULL;

-- Migrate existing user_type/year_group to academic_year
UPDATE public.profiles 
SET academic_year = CASE 
  WHEN user_type = 'foundation' OR year_group = 'foundation' THEN 'foundation'
  WHEN user_type = 'year1' OR year_group = 'year1' THEN 'year_1' 
  WHEN user_type = 'year2' OR year_group = 'year2' THEN 'year_2'
  WHEN user_type = 'year3' OR year_group = 'year3' THEN 'year_3'
  ELSE 'foundation'
END
WHERE academic_year IS NULL;

-- Make academic_year NOT NULL after migration
ALTER TABLE public.profiles 
ALTER COLUMN academic_year SET NOT NULL;

-- Function to prevent changing academic_year after trial
CREATE OR REPLACE FUNCTION public.prevent_year_change_after_trial()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Allow changes during trial or if academic_year is NULL (first time setting)
  IF (NEW.academic_year IS DISTINCT FROM OLD.academic_year) THEN
    IF (NOW() > COALESCE(OLD.trial_ends_at, NOW() - INTERVAL '1 day')) THEN
      RAISE EXCEPTION 'Academic year cannot be changed after trial period ends';
    END IF;
  END IF;
  RETURN NEW;
END; $$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trg_prevent_year_change_after_trial ON public.profiles;

-- Create trigger to prevent year changes after trial
CREATE TRIGGER trg_prevent_year_change_after_trial
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW 
  EXECUTE FUNCTION public.prevent_year_change_after_trial();

-- Update RLS policy for profile updates
DROP POLICY IF EXISTS "user can update own profile fields" ON public.profiles;

CREATE POLICY "user can update own profile fields"
  ON public.profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Index for performance on trial queries
CREATE INDEX IF NOT EXISTS idx_profiles_trial_ends_at ON public.profiles(trial_ends_at);
CREATE INDEX IF NOT EXISTS idx_profiles_academic_year ON public.profiles(academic_year);