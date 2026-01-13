-- Harden lectures table with error visibility and processing timestamp
-- Migration: 20260113_harden_lectures.sql

ALTER TABLE public.lectures 
ADD COLUMN IF NOT EXISTS error_message text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_processed_at timestamptz DEFAULT NULL;

COMMENT ON COLUMN public.lectures.error_message IS 'Error message if processing failed';
COMMENT ON COLUMN public.lectures.last_processed_at IS 'Timestamp of last processing attempt';

-- Add index for status queries
CREATE INDEX IF NOT EXISTS idx_lectures_status ON public.lectures(status);
CREATE INDEX IF NOT EXISTS idx_lectures_user_status ON public.lectures(user_id, status);
