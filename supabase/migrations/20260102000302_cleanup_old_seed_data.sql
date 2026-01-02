-- Direct SQL cleanup for timetable_events
-- Run this in Supabase SQL Editor to clean old seed data
-- This bypasses RLS and doesn't require auth context

BEGIN;

-- Show current data
SELECT id, title, to_char(start_time AT TIME ZONE 'Europe/London', 'YYYY-MM-DD HH24:MI') as start_london, 
       source, user_id
FROM timetable_events
WHERE source IN ('seed', 'dev-seed', 'dev-seed-v1')
ORDER BY start_time;

-- Delete ALL seed data (old timezone bugs + new)
DELETE FROM timetable_events
WHERE source IN ('seed', 'dev-seed', 'dev-seed-v1');

COMMIT;

-- After this, user must click "Seed Timetable (dev)" in the app
-- OR run: SELECT seed_timetable_events_v1('epiphany2026');
-- (but the SELECT requires being called through authenticated Supabase client)
