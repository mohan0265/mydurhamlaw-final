-- Migration: Add manual entry fields to glossary_terms
-- Date: 2026-01-31

ALTER TABLE glossary_terms ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT FALSE;
ALTER TABLE glossary_terms ADD COLUMN IF NOT EXISTS created_by_name TEXT;
