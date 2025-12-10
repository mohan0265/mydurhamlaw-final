-- Create a specific migration for the timetable and profile updates

-- 1. Extend profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS preferred_name text,
ADD COLUMN IF NOT EXISTS year_of_study text, -- 'Foundation', 'Year 1', 'Year 2', 'Year 3'
ADD COLUMN IF NOT EXISTS degree_type text,   -- 'LLB', 'MLaw', 'Other'
ADD COLUMN IF NOT EXISTS modules text[],     -- Array of module names/codes
ADD COLUMN IF NOT EXISTS last_profile_updated_at timestamptz;

-- 2. Create timetable_events table
CREATE TABLE IF NOT EXISTS timetable_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  module_code text, -- e.g. LAW1231
  location text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  recurrence_pattern text DEFAULT 'weekly', -- Simple string for now
  source text DEFAULT 'pasted_timetable',   -- 'pasted_timetable', 'manual', etc.
  created_at timestamptz DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE timetable_events ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Users can see their own events
CREATE POLICY "Users can view their own timetable events" 
ON timetable_events FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own events
CREATE POLICY "Users can insert their own timetable events" 
ON timetable_events FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own events
CREATE POLICY "Users can update their own timetable events" 
ON timetable_events FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own events
CREATE POLICY "Users can delete their own timetable events" 
ON timetable_events FOR DELETE 
USING (auth.uid() = user_id);
