-- Migration: Create personal_items table for student calendar entries
-- Created: 2026-01-07
-- Purpose: Enable students to add personal study blocks, tasks, appointments, reminders to YAAG

-- Create table if not exists (idempotent)
CREATE TABLE IF NOT EXISTS public.personal_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('study', 'task', 'appointment', 'reminder')),
  start_at timestamptz NOT NULL,
  end_at timestamptz NULL,
  notes text NULL,
  is_all_day boolean NOT NULL DEFAULT false,
  module_id text NULL,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes (idempotent)
CREATE INDEX IF NOT EXISTS personal_items_user_start_idx ON public.personal_items(user_id, start_at);
CREATE INDEX IF NOT EXISTS personal_items_user_completed_idx ON public.personal_items(user_id, completed);

-- Enable RLS
ALTER TABLE public.personal_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own personal items" ON public.personal_items;
DROP POLICY IF EXISTS "Users can insert own personal items" ON public.personal_items;
DROP POLICY IF EXISTS "Users can update own personal items" ON public.personal_items;
DROP POLICY IF EXISTS "Users can delete own personal items" ON public.personal_items;

-- Create RLS policies (idempotent via drop above)
CREATE POLICY "Users can view own personal items"
  ON public.personal_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own personal items"
  ON public.personal_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own personal items"
  ON public.personal_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own personal items"
  ON public.personal_items FOR DELETE
  USING (auth.uid() = user_id);

-- Create or replace updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS set_personal_items_updated_at ON public.personal_items;

-- Create trigger
CREATE TRIGGER set_personal_items_updated_at
  BEFORE UPDATE ON public.personal_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.personal_items TO authenticated;
GRANT USAGE ON SEQUENCE personal_items_id_seq TO authenticated;

-- Verification comment
COMMENT ON TABLE public.personal_items IS 'Student personal calendar items for YAAG (study blocks, tasks, appointments, reminders)';
