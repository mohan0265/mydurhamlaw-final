-- Migration: Supabase Performance and Schema Fixes
-- Date: 2026-01-04
-- Purpose: Add missing indexes and profile columns that were causing 408 timeouts and 400 errors

-- =======================
-- PART 1: Performance Indexes
-- =======================
-- These indexes dramatically improve query performance and prevent request timeouts

CREATE INDEX IF NOT EXISTS idx_assignments_user_id ON assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignment_files_assignment_id ON assignment_files(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_files_user_id ON assignment_files(user_id);

-- NOTE: profiles.id is already the PRIMARY KEY and thus already indexed

-- =======================
-- PART 2: Missing Profile Columns
-- =======================
-- These columns are required by the application but were missing from the schema

ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS onboarding_progress INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS uploaded_docs JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';

-- =======================
-- VERIFICATION
-- =======================
-- After running this migration, verify:
-- 1. All indexes exist: SELECT * FROM pg_indexes WHERE tablename IN ('assignments', 'assignment_files', 'profiles');
-- 2. Profile columns exist: SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles';
