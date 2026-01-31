-- Migration: Master Glossary (Lexicon)
-- Date: 2026-01-30
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Create glossary_terms table
CREATE TABLE IF NOT EXISTS glossary_terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    term TEXT NOT NULL,
    definition TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, term)
);

-- 2. Create link table for contextual references
CREATE TABLE IF NOT EXISTS lecture_glossary_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term_id UUID NOT NULL REFERENCES glossary_terms(id) ON DELETE CASCADE,
    lecture_id UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(term_id, lecture_id)
);

-- 3. Enable RLS
ALTER TABLE glossary_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecture_glossary_links ENABLE ROW LEVEL SECURITY;

-- 4. Policies
DROP POLICY IF EXISTS "Users can manage their own glossary terms" ON glossary_terms;
CREATE POLICY "Users can manage their own glossary terms"
    ON glossary_terms FOR ALL
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own glossary links" ON lecture_glossary_links;
CREATE POLICY "Users can manage their own glossary links"
    ON lecture_glossary_links FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM glossary_terms 
            WHERE glossary_terms.id = lecture_glossary_links.term_id 
            AND glossary_terms.user_id = auth.uid()
        )
    );

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_glossary_user ON glossary_terms(user_id);
CREATE INDEX IF NOT EXISTS idx_glossary_term_search ON glossary_terms USING gin(term gin_trgm_ops); -- Assuming pg_trgm is enabled
CREATE INDEX IF NOT EXISTS idx_glossary_links_lecture ON lecture_glossary_links(lecture_id);
CREATE INDEX IF NOT EXISTS idx_glossary_links_term ON lecture_glossary_links(term_id);
