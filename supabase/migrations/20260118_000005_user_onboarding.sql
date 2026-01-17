-- Migration: User Onboarding Progress Tracker
-- Caches computed onboarding completion status for dashboard display

-- Main table: user_onboarding
CREATE TABLE IF NOT EXISTS public.user_onboarding (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Completion flags (computed from source tables)
  timetable_done boolean DEFAULT false NOT NULL,
  assignment_done boolean DEFAULT false NOT NULL,
  lecture_done boolean DEFAULT false NOT NULL,
  awy_done boolean DEFAULT false NOT NULL,
  
  -- Metadata
  last_checked_at timestamptz DEFAULT now() NOT NULL
);

-- Index for faster lookups and admin queries
CREATE INDEX IF NOT EXISTS idx_user_onboarding_updated
  ON public.user_onboarding(updated_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_user_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_onboarding_updated_at_trigger
  BEFORE UPDATE ON public.user_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION update_user_onboarding_updated_at();

-- Enable RLS
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own onboarding data

-- SELECT policy
CREATE POLICY "Users can view own onboarding progress"
  ON public.user_onboarding FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT policy
CREATE POLICY "Users can insert own onboarding progress"
  ON public.user_onboarding FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE policy
CREATE POLICY "Users can update own onboarding progress"
  ON public.user_onboarding FOR UPDATE
  USING (auth.uid() = user_id);

-- Comments for documentation
COMMENT ON TABLE public.user_onboarding IS 'Caches user onboarding progress computed from source tables';
COMMENT ON COLUMN public.user_onboarding.timetable_done IS 'Has user connected timetable (timetable_events or user_events)';
COMMENT ON COLUMN public.user_onboarding.assignment_done IS 'Has user added at least one assignment';
COMMENT ON COLUMN public.user_onboarding.lecture_done IS 'Has user imported at least one lecture';
COMMENT ON COLUMN public.user_onboarding.awy_done IS 'Has user connected at least one active loved one (AWY)';
COMMENT ON COLUMN public.user_onboarding.last_checked_at IS 'Timestamp of last status computation';
