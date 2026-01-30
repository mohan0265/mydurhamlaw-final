-- Migration: Fix and Harden Lecture Status Constraint
-- Date: 2026-01-30
-- Description: Updates the valid status values for lectures to support the new OpenAI flow while maintaining legacy compatibility.

BEGIN;

-- 1. Drop existing constraint
ALTER TABLE public.lectures DROP CONSTRAINT IF EXISTS lectures_status_check;

-- 2. Add new constraint with all valid statuses (new + legacy)
ALTER TABLE public.lectures ADD CONSTRAINT lectures_status_check 
CHECK (status IN (
    'uploaded',
    'queued',
    'processing',
    'summarizing',
    'ready',
    'failed',
    -- Legacy statuses kept for data integrity
    'transcribing',
    'error'
));

COMMIT;
