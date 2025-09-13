-- Always With You Feature - Database Schema
-- Run this in your Supabase SQL editor

-- Add columns to existing profiles table for parent/loved one connections
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS parent1_email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS parent1_relationship TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS parent1_display_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS parent2_email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS parent2_relationship TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS parent2_display_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sharing_settings JSONB DEFAULT '{"show_live_status_to_parents": true, "share_today_calendar": true, "share_custom_notes": true, "do_not_disturb": false, "quiet_hours_start": "22:00", "quiet_hours_end": "08:00"}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_updates JSONB DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_activity TEXT;

-- Create video call sessions table
CREATE TABLE IF NOT EXISTS video_call_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('initiating', 'ringing', 'active', 'ended')) DEFAULT 'initiating',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration INTEGER, -- Duration in seconds
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create presence tracking table
CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_page TEXT,
  activity TEXT,
  metadata JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id)
);

-- Create parent session tokens table (for secure parent login)
CREATE TABLE IF NOT EXISTS parent_session_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_email TEXT NOT NULL,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_video_call_sessions_student_id ON video_call_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_video_call_sessions_parent_email ON video_call_sessions(parent_email);
CREATE INDEX IF NOT EXISTS idx_video_call_sessions_status ON video_call_sessions(status);
CREATE INDEX IF NOT EXISTS idx_user_presence_is_online ON user_presence(is_online);
CREATE INDEX IF NOT EXISTS idx_parent_session_tokens_email ON parent_session_tokens(parent_email);
CREATE INDEX IF NOT EXISTS idx_parent_session_tokens_student_id ON parent_session_tokens(student_id);

-- RLS Policies
ALTER TABLE video_call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_session_tokens ENABLE ROW LEVEL SECURITY;

-- Students can access their own call sessions
CREATE POLICY "Students can view their own call sessions" ON video_call_sessions
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own call sessions" ON video_call_sessions
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own call sessions" ON video_call_sessions
  FOR UPDATE USING (auth.uid() = student_id);

-- Parents can view call sessions if their email matches
CREATE POLICY "Parents can view call sessions" ON video_call_sessions
  FOR SELECT USING (
    parent_email IN (
      SELECT parent1_email FROM profiles WHERE id = student_id
      UNION
      SELECT parent2_email FROM profiles WHERE id = student_id
    )
  );

-- Presence policies
CREATE POLICY "Users can manage their own presence" ON user_presence
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Parents can view student presence" ON user_presence
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM profiles 
      WHERE parent1_email = auth.jwt() ->> 'email' 
         OR parent2_email = auth.jwt() ->> 'email'
    )
  );

-- Parent session token policies
CREATE POLICY "Parents can manage their own tokens" ON parent_session_tokens
  FOR ALL USING (parent_email = auth.jwt() ->> 'email');

-- Update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_video_call_sessions_updated_at BEFORE UPDATE ON video_call_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_presence_updated_at BEFORE UPDATE ON user_presence
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check if a parent email is authorized for a student
CREATE OR REPLACE FUNCTION is_authorized_parent(parent_email_param TEXT, student_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM profiles 
    WHERE id = student_id_param 
    AND (parent1_email = parent_email_param OR parent2_email = parent_email_param)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get student info for authorized parent
CREATE OR REPLACE FUNCTION get_student_info_for_parent(parent_email_param TEXT)
RETURNS TABLE(
  student_id UUID,
  display_name TEXT,
  user_type TEXT,
  sharing_settings JSONB,
  custom_updates JSONB,
  current_activity TEXT,
  is_online BOOLEAN,
  last_seen TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.display_name,
    p.user_type,
    p.sharing_settings,
    p.custom_updates,
    p.current_activity,
    COALESCE(up.is_online, false),
    COALESCE(up.last_seen, p.updated_at)
  FROM profiles p
  LEFT JOIN user_presence up ON p.id = up.user_id
  WHERE p.parent1_email = parent_email_param 
     OR p.parent2_email = parent_email_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;