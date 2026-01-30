-- Create assignment_progress table for autosave functionality
-- This table stores incremental progress for each stage

DROP TABLE IF EXISTS public.assignment_progress;

CREATE TABLE public.assignment_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assignment_id text NOT NULL,
  workflow_key text DEFAULT 'assignment_workflow',
  step_key text NOT NULL,
  content jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  -- CRITICAL: This unique constraint must match the onConflict in the API
  CONSTRAINT assignment_progress_unique UNIQUE (user_id, assignment_id, step_key)
);

-- Enable RLS
ALTER TABLE public.assignment_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own progress"
  ON public.assignment_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.assignment_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.assignment_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
  ON public.assignment_progress FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.assignment_progress TO authenticated;

-- Indexes for performance
CREATE INDEX idx_assignment_progress_user ON public.assignment_progress(user_id);
CREATE INDEX idx_assignment_progress_assignment ON public.assignment_progress(assignment_id);
CREATE INDEX idx_assignment_progress_step ON public.assignment_progress(user_id, assignment_id, step_key);
