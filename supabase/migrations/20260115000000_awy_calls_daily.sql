-- Migration: 20260115_awy_calls_daily.sql
-- Purpose: Create call signaling table for Daily.co video calls

-- Create the awy_calls table for call signaling
CREATE TABLE IF NOT EXISTS awy_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  loved_one_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_url text NOT NULL,
  room_name text NOT NULL,
  status text NOT NULL DEFAULT 'ringing' CHECK (status IN ('ringing', 'accepted', 'declined', 'ended', 'missed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz NULL,
  ended_at timestamptz NULL
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_awy_calls_loved_one_status 
  ON awy_calls(loved_one_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_awy_calls_student_status 
  ON awy_calls(student_id, status, created_at DESC);

-- Enable RLS
ALTER TABLE awy_calls ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- SELECT: Allow if user is student or loved one in the call
CREATE POLICY "Users can view their own calls"
  ON awy_calls FOR SELECT
  USING (auth.uid() = student_id OR auth.uid() = loved_one_id);

-- INSERT: Only students can start calls
CREATE POLICY "Students can start calls"
  ON awy_calls FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- UPDATE: Either party can update (for accept/decline/end)
CREATE POLICY "Participants can update calls"
  ON awy_calls FOR UPDATE
  USING (auth.uid() = student_id OR auth.uid() = loved_one_id);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE awy_calls;

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE ON awy_calls TO authenticated;
