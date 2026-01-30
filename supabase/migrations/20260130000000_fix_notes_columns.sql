-- Migration: Add missing columns to lecture_notes to fix AI processing loop
-- These columns are referenced in the Gemini analysis logic but were missing in some environments

ALTER TABLE public.lecture_notes 
ADD COLUMN IF NOT EXISTS glossary jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.lecture_notes 
ADD COLUMN IF NOT EXISTS engagement_hooks jsonb DEFAULT '[]'::jsonb;

-- Ensure exam_signals also exists just in case
ALTER TABLE public.lecture_notes 
ADD COLUMN IF NOT EXISTS exam_signals jsonb DEFAULT '[]'::jsonb;
