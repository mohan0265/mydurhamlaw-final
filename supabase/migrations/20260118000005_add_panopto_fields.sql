-- Migration: Add Panopto integration fields to lectures table
-- Purpose: Enable students to import Panopto lecture transcripts with clickable source links

-- Add Panopto-specific fields to lectures table
ALTER TABLE public.lectures 
ADD COLUMN IF NOT EXISTS panopto_url TEXT,
ADD COLUMN IF NOT EXISTS transcript_source TEXT 
  CHECK (transcript_source IN ('audio_upload', 'panopto_paste', 'manual_entry', 'api_import'));

-- Index for filtering by source
CREATE INDEX IF NOT EXISTS idx_lectures_transcript_source 
  ON public.lectures(transcript_source);

-- Add helpful comments
COMMENT ON COLUMN public.lectures.panopto_url IS 'Optional link to original Panopto recording viewer URL';
COMMENT ON COLUMN public.lectures.transcript_source IS 'How the lecture content was obtained: audio_upload (default), panopto_paste (Phase 1), manual_entry, api_import (Phase 2+)';

-- Update existing records to have transcript_source = 'audio_upload' if they have an audio_path
UPDATE public.lectures 
SET transcript_source = 'audio_upload' 
WHERE transcript_source IS NULL AND audio_path IS NOT NULL AND audio_path != '';
