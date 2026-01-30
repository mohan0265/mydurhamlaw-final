-- Migration: Add source_reference to glossary_terms
-- Date: 2026-01-30

ALTER TABLE glossary_terms ADD COLUMN IF NOT EXISTS source_reference TEXT;
