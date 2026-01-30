-- Migration: Add plan override fields to personal_items
-- Run this in Supabase SQL Editor

-- Add new columns for plan/timetable overrides and customization
ALTER TABLE personal_items 
  ADD COLUMN IF NOT EXISTS original_plan_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS original_timetable_id UUID REFERENCES timetable_events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tutor TEXT,
  ADD COLUMN IF NOT EXISTS venue TEXT,
  ADD COLUMN IF NOT EXISTS color VARCHAR(20),
  ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT FALSE;

-- Add index for efficient override lookups
CREATE INDEX IF NOT EXISTS idx_personal_plan_override 
  ON personal_items(user_id, original_plan_id) 
  WHERE original_plan_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_personal_timetable_override 
  ON personal_items(user_id, original_timetable_id) 
  WHERE original_timetable_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN personal_items.original_plan_id IS 
  'Links this entry to a static plan event ID for customization (e.g., LAW1051-W1)';

COMMENT ON COLUMN personal_items.original_timetable_id IS 
  'Links this entry to a timetable_events row for editing';

COMMENT ON COLUMN personal_items.tutor IS 
  'Lecturer or tutor name added by student';

COMMENT ON COLUMN personal_items.venue IS 
  'Room or location override';

COMMENT ON COLUMN personal_items.color IS 
  'Custom badge color (hex or name)';

COMMENT ON COLUMN personal_items.is_cancelled IS 
  'Whether student marked this event as cancelled';

-- Reload PostgREST schema
NOTIFY pgrst, 'reload schema';

-- Verify the migration
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'personal_items'
  AND column_name IN ('original_plan_id', 'original_timetable_id', 'tutor', 'venue', 'color', 'is_cancelled')
ORDER BY ordinal_position;
