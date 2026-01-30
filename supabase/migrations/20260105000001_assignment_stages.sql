-- Migration: Create assignment_stages table for workflow progress tracking
-- Purpose: Track which stage student is on, enable resume-from-last-stage

-- Drop existing table if schema needs updating
DROP TABLE IF EXISTS public.assignment_stages;

-- Create assignment_stages table
CREATE TABLE public.assignment_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_stage integer NOT NULL DEFAULT 1,
  stage_1_complete boolean DEFAULT false,
  stage_2_complete boolean DEFAULT false,
  stage_3_complete boolean DEFAULT false,
  stage_4_complete boolean DEFAULT false,
  stage_5_complete boolean DEFAULT false,
  stage_6_complete boolean DEFAULT false,
  stage_data jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT assignment_stages_unique UNIQUE (user_id, assignment_id)
);

-- Enable Row Level Security
ALTER TABLE public.assignment_stages ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own workflow progress
CREATE POLICY "Users can view own stages"
  ON public.assignment_stages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stages"
  ON public.assignment_stages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stages"
  ON public.assignment_stages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stages"
  ON public.assignment_stages FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.assignment_stages TO authenticated;

-- Indexes for performance
CREATE INDEX idx_assignment_stages_user ON public.assignment_stages(user_id);
CREATE INDEX idx_assignment_stages_assignment ON public.assignment_stages(assignment_id);
