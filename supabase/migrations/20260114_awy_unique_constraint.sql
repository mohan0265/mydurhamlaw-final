-- Add unique constraint to prevent duplicate connections
-- This prevents the "phantom parent" issue where multiple rows exist for the same student-parent pair
-- We use COALESCE to handle legacy rows where email might be in 'email' or 'loved_email' columns
-- LOWER() ensures case-insensitive uniqueness

CREATE UNIQUE INDEX IF NOT EXISTS awy_connections_unique_student_loved
ON public.awy_connections (student_id, lower(COALESCE(loved_email, email)));
