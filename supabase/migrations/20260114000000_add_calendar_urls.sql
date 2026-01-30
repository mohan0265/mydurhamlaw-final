-- Add calendar URL columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS timetable_url TEXT,
ADD COLUMN IF NOT EXISTS blackboard_url TEXT;

COMMENT ON COLUMN public.profiles.timetable_url IS 'URL for the University MyTimetable ICS feed';
COMMENT ON COLUMN public.profiles.blackboard_url IS 'URL for the Blackboard Ultra Calendar ICS feed';
