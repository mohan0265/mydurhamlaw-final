-- Migration: Processing State Machine Hardening
-- Filename: supabase/migrations/20260131113000_lecture_state_machine.sql

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'processing_state_type') THEN
        CREATE TYPE processing_state_type AS ENUM (
            'uploaded', 
            'queued', 
            'processing', 
            'processed', 
            'verified', 
            'failed'
        );
    END IF;
END $$;

-- 1. Add columns to lectures
ALTER TABLE lectures ADD COLUMN IF NOT EXISTS processing_state processing_state_type DEFAULT 'uploaded';
ALTER TABLE lectures ADD COLUMN IF NOT EXISTS processing_version INTEGER DEFAULT 1;
ALTER TABLE lectures ADD COLUMN IF NOT EXISTS processing_error JSONB;
ALTER TABLE lectures ADD COLUMN IF NOT EXISTS verification_results JSONB;

-- 2. Backfill existing data
-- Map legacy 'status' to new 'processing_state'
UPDATE lectures SET processing_state = 'verified' WHERE status = 'ready';
UPDATE lectures SET processing_state = 'processing' WHERE status IN ('processing', 'transcribing');
UPDATE lectures SET processing_state = 'failed' WHERE status = 'failed';
UPDATE lectures SET processing_state = 'uploaded' WHERE status = 'uploaded' OR status IS NULL;

-- 3. Update academic_items state if applicable
-- This is a partial sync, real sync happens in the pipeline
-- We can't easily update JSONB keys with a simple SQL if the structure is complex, 
-- but let's try to keep it consistent for 'ready' items.
UPDATE academic_items 
SET state = state || jsonb_build_object('status', 'verified', 'progress', 1.0)
WHERE state->>'status' = 'ready';

-- 4. Add Indexes
CREATE INDEX IF NOT EXISTS idx_lectures_processing_state ON lectures(processing_state);

-- 5. Hardening: Add a trigger to prevent invalid state transitions (Optional but recommended)
-- For now, we'll rely on app logic but adding a CHECK constraint for basic sanity
-- (e.g. processing_version should always be >= 1)
ALTER TABLE lectures ADD CONSTRAINT chk_processing_version CHECK (processing_version >= 1);
