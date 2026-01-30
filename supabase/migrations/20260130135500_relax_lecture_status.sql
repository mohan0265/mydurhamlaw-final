-- Migration: Allow 'processing' status in lectures table
-- Date: 2026-01-30

BEGIN;

-- Drop existing constraint
ALTER TABLE public.lectures DROP CONSTRAINT IF EXISTS lectures_status_check;

-- Add updated constraint including 'processing' and keeping others for compatibility
ALTER TABLE public.lectures ADD CONSTRAINT lectures_status_check 
CHECK (status IN ('uploaded', 'processing', 'transcribing', 'summarizing', 'ready', 'error', 'queued'));

COMMIT;
