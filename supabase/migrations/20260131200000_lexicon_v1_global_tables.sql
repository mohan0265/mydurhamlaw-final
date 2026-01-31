-- Lexicon V1: Global Seed + Unknown Term Capture + Star Frequency
-- Date: 2026-01-31
-- Purpose: Create global lexicon master table, unknown query tracking, and star/frequency system

-- ============================================================================
-- 1. LEXICON_MASTER_TERMS (Global Seed)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.lexicon_master_terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    area_of_law TEXT,
    priority INT CHECK (priority BETWEEN 1 AND 5),
    common_in_year TEXT,
    aliases TEXT[] DEFAULT '{}',
    confusion_with TEXT[] DEFAULT '{}',
    short_def TEXT,
    long_def TEXT,
    source TEXT NOT NULL DEFAULT 'seed' CHECK (source IN ('seed', 'user', 'ai_saved')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint on normalized term
CREATE UNIQUE INDEX IF NOT EXISTS idx_lexicon_master_term_lower ON public.lexicon_master_terms (LOWER(term));

-- Indexes for search performance
CREATE INDEX IF NOT EXISTS idx_lexicon_master_slug ON public.lexicon_master_terms (slug);
CREATE INDEX IF NOT EXISTS idx_lexicon_master_area ON public.lexicon_master_terms (area_of_law);
CREATE INDEX IF NOT EXISTS idx_lexicon_master_priority ON public.lexicon_master_terms (priority DESC);
CREATE INDEX IF NOT EXISTS idx_lexicon_master_source ON public.lexicon_master_terms (source);

-- GIN index for full-text search on term
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_lexicon_master_term_trgm ON public.lexicon_master_terms USING gin (term gin_trgm_ops);

-- GIN index for array search on aliases
CREATE INDEX IF NOT EXISTS idx_lexicon_master_aliases ON public.lexicon_master_terms USING gin (aliases);

-- RLS: Everyone can read master terms
ALTER TABLE public.lexicon_master_terms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read master lexicon terms" ON public.lexicon_master_terms;
CREATE POLICY "Anyone can read master lexicon terms"
    ON public.lexicon_master_terms
    FOR SELECT
    USING (true);

-- Only service role can insert/update/delete seed terms
DROP POLICY IF EXISTS "Only service role can manage master terms" ON public.lexicon_master_terms;
CREATE POLICY "Only service role can manage master terms"
    ON public.lexicon_master_terms
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 2. LEXICON_UNKNOWN_QUERIES (Track Unknown Searches)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.lexicon_unknown_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    normalized_text TEXT NOT NULL,
    first_seen_at TIMESTAMPTZ DEFAULT now(),
    last_seen_at TIMESTAMPTZ DEFAULT now(),
    count INT NOT NULL DEFAULT 1,
    resolved_term_id UUID REFERENCES public.lexicon_master_terms(id) ON DELETE SET NULL,
    resolution_source TEXT CHECK (resolution_source IN ('durmah', 'admin', 'seed_update'))
);

-- Unique per user + normalized query
CREATE UNIQUE INDEX IF NOT EXISTS idx_lexicon_unknown_user_query 
    ON public.lexicon_unknown_queries (user_id, normalized_text);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lexicon_unknown_user ON public.lexicon_unknown_queries (user_id);
CREATE INDEX IF NOT EXISTS idx_lexicon_unknown_resolved ON public.lexicon_unknown_queries (resolved_term_id) 
    WHERE resolved_term_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lexicon_unknown_count ON public.lexicon_unknown_queries (count DESC);

-- RLS: Users can manage their own unknown queries
ALTER TABLE public.lexicon_unknown_queries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own unknown queries" ON public.lexicon_unknown_queries;
CREATE POLICY "Users can manage their own unknown queries"
    ON public.lexicon_unknown_queries
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 3. LEXICON_USER_STARS (Star + Personal Priority + Notes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.lexicon_user_stars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES public.lexicon_master_terms(id) ON DELETE CASCADE,
    is_starred BOOLEAN DEFAULT false,
    personal_priority INT CHECK (personal_priority BETWEEN 1 AND 5),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, term_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lexicon_stars_user ON public.lexicon_user_stars (user_id);
CREATE INDEX IF NOT EXISTS idx_lexicon_stars_term ON public.lexicon_user_stars (term_id);
CREATE INDEX IF NOT EXISTS idx_lexicon_stars_starred ON public.lexicon_user_stars (user_id, is_starred) 
    WHERE is_starred = true;
CREATE INDEX IF NOT EXISTS idx_lexicon_stars_priority ON public.lexicon_user_stars (user_id, personal_priority DESC);

-- RLS: Users can manage their own stars
ALTER TABLE public.lexicon_user_stars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own lexicon stars" ON public.lexicon_user_stars;
CREATE POLICY "Users can manage their own lexicon stars"
    ON public.lexicon_user_stars
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 4. MIGRATE EXISTING DATA
-- ============================================================================

-- Migrate glossary_terms → lexicon_master_terms (source='user')
DO $$
BEGIN
    -- Insert existing user terms into master if not exists
    INSERT INTO public.lexicon_master_terms (term, slug, short_def, long_def, source, created_at, updated_at)
    SELECT DISTINCT ON (LOWER(gt.term))
        gt.term,
        LOWER(REGEXP_REPLACE(gt.term, '[^a-zA-Z0-9]+', '-', 'g')) as slug,
        LEFT(gt.definition, 200) as short_def,
        gt.definition as long_def,
        'user' as source,
        MIN(gt.created_at) as created_at,
        MAX(gt.updated_at) as updated_at
    FROM public.glossary_terms gt
    WHERE NOT EXISTS (
        SELECT 1 FROM public.lexicon_master_terms lmt
        WHERE LOWER(lmt.term) = LOWER(gt.term)
    )
    GROUP BY gt.term, gt.definition
    ON CONFLICT (LOWER(term)) DO NOTHING;

    -- Create mapping table for old term_ids → new master term_ids
    CREATE TEMP TABLE term_id_mapping AS
    SELECT 
        gt.id as old_term_id,
        lmt.id as new_term_id,
        gt.user_id
    FROM public.glossary_terms gt
    INNER JOIN public.lexicon_master_terms lmt ON LOWER(gt.term) = LOWER(lmt.term);

    -- CRITICAL FIX: Drop old FK constraint on lecture_glossary_links before updating
    ALTER TABLE public.lecture_glossary_links 
        DROP CONSTRAINT IF EXISTS lecture_glossary_links_term_id_fkey;

    -- Migrate lecture_glossary_links to point to master terms
    -- Update existing links to point to master term_id
    UPDATE public.lecture_glossary_links lgl
    SET term_id = tim.new_term_id
    FROM term_id_mapping tim
    WHERE lgl.term_id = tim.old_term_id;

    -- Add new FK constraint pointing to lexicon_master_terms
    ALTER TABLE public.lecture_glossary_links
        ADD CONSTRAINT lecture_glossary_links_term_id_fkey 
        FOREIGN KEY (term_id) 
        REFERENCES public.lexicon_master_terms(id) 
        ON DELETE CASCADE;

    -- Migrate glossary_user_notes → lexicon_user_stars (if table exists)
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_schema = 'public' 
               AND table_name = 'glossary_user_notes') THEN
        
        INSERT INTO public.lexicon_user_stars (user_id, term_id, notes, created_at, updated_at)
        SELECT 
            gun.user_id,
            tim.new_term_id,
            gun.notes,
            gun.created_at,
            gun.updated_at
        FROM public.glossary_user_notes gun
        INNER JOIN term_id_mapping tim ON gun.term_id = tim.old_term_id
        ON CONFLICT (user_id, term_id) 
        DO UPDATE SET 
            notes = EXCLUDED.notes,
            updated_at = EXCLUDED.updated_at;
            
        RAISE NOTICE 'Migrated % rows from glossary_user_notes', (SELECT COUNT(*) FROM public.glossary_user_notes);
    ELSE
        RAISE NOTICE 'Table glossary_user_notes does not exist, skipping migration';
    END IF;

    DROP TABLE term_id_mapping;
END $$;

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

-- Auto-update updated_at on lexicon_master_terms
CREATE OR REPLACE FUNCTION update_lexicon_master_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_lexicon_master_updated_at ON public.lexicon_master_terms;
CREATE TRIGGER trigger_lexicon_master_updated_at
    BEFORE UPDATE ON public.lexicon_master_terms
    FOR EACH ROW
    EXECUTE FUNCTION update_lexicon_master_updated_at();

-- Auto-update updated_at on lexicon_user_stars
CREATE OR REPLACE FUNCTION update_lexicon_stars_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_lexicon_stars_updated_at ON public.lexicon_user_stars;
CREATE TRIGGER trigger_lexicon_stars_updated_at
    BEFORE UPDATE ON public.lexicon_user_stars
    FOR EACH ROW
    EXECUTE FUNCTION update_lexicon_stars_updated_at();

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Function to normalize text for search (lowercase, trim, remove special chars)
CREATE OR REPLACE FUNCTION normalize_search_text(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN LOWER(TRIM(REGEXP_REPLACE(input_text, '[^a-zA-Z0-9 ]', '', 'g')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;
