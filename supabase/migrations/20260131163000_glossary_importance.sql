-- Migration: Add importance_level to glossary_terms
-- Date: 2026-01-31

ALTER TABLE glossary_terms 
ADD COLUMN IF NOT EXISTS importance_level INTEGER DEFAULT 0;

-- Index for sorting performance
CREATE INDEX IF NOT EXISTS idx_glossary_importance ON glossary_terms(importance_level DESC, created_at DESC);
