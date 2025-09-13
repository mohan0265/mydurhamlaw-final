-- Legal News Feed Tables
-- This migration creates tables for news preferences and saved articles

-- ===== NEWS PREFERENCES TABLE =====

CREATE TABLE IF NOT EXISTS public.news_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    preferences JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one preference set per user
    UNIQUE(user_id)
);

-- ===== SAVED ARTICLES TABLE =====

CREATE TABLE IF NOT EXISTS public.saved_articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    article_id TEXT NOT NULL,
    article_data JSONB NOT NULL,
    notes TEXT,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate saves
    UNIQUE(user_id, article_id)
);

-- ===== INDEXES FOR PERFORMANCE =====

-- News preferences indexes
CREATE INDEX IF NOT EXISTS idx_news_preferences_user_id ON public.news_preferences(user_id);

-- Saved articles indexes
CREATE INDEX IF NOT EXISTS idx_saved_articles_user_id ON public.saved_articles(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_articles_saved_at ON public.saved_articles(saved_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_articles_user_recent ON public.saved_articles(user_id, saved_at DESC);

-- ===== ROW LEVEL SECURITY =====

-- Enable RLS on both tables
ALTER TABLE public.news_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_articles ENABLE ROW LEVEL SECURITY;

-- News preferences policies
CREATE POLICY "Users can view own news preferences" ON public.news_preferences
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own news preferences" ON public.news_preferences
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own news preferences" ON public.news_preferences
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own news preferences" ON public.news_preferences
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Saved articles policies
CREATE POLICY "Users can view own saved articles" ON public.saved_articles
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can save articles" ON public.saved_articles
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved articles" ON public.saved_articles
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved articles" ON public.saved_articles
    FOR DELETE 
    USING (auth.uid() = user_id);

-- ===== TRIGGERS =====

-- Update timestamp trigger for news preferences
CREATE OR REPLACE FUNCTION public.update_news_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER news_preferences_updated_at_trigger
    BEFORE UPDATE ON public.news_preferences
    FOR EACH ROW EXECUTE FUNCTION public.update_news_preferences_updated_at();

-- ===== API HELPER FUNCTIONS =====

-- Function to get user's saved articles with pagination
CREATE OR REPLACE FUNCTION public.get_user_saved_articles(
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
    user_id UUID;
    result JSON;
BEGIN
    user_id := auth.uid();
    
    IF user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Not authenticated');
    END IF;
    
    SELECT json_build_object(
        'success', true,
        'articles', json_agg(
            json_build_object(
                'id', id,
                'article_id', article_id,
                'article_data', article_data,
                'notes', notes,
                'saved_at', saved_at
            ) ORDER BY saved_at DESC
        ),
        'total_count', (
            SELECT COUNT(*) FROM public.saved_articles WHERE user_id = get_user_saved_articles.user_id
        )
    ) INTO result
    FROM (
        SELECT *
        FROM public.saved_articles
        WHERE user_id = get_user_saved_articles.user_id
        ORDER BY saved_at DESC
        LIMIT p_limit OFFSET p_offset
    ) limited_articles;
    
    RETURN COALESCE(result, json_build_object('success', true, 'articles', '[]'::json, 'total_count', 0));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to save article with duplicate handling
CREATE OR REPLACE FUNCTION public.save_article_safe(
    p_article_id TEXT,
    p_article_data JSONB,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    user_id UUID;
    result JSON;
BEGIN
    user_id := auth.uid();
    
    IF user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Not authenticated');
    END IF;
    
    -- Check if already saved
    IF EXISTS (
        SELECT 1 FROM public.saved_articles 
        WHERE user_id = save_article_safe.user_id AND article_id = p_article_id
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Article already saved');
    END IF;
    
    -- Save the article
    INSERT INTO public.saved_articles (user_id, article_id, article_data, notes)
    VALUES (user_id, p_article_id, p_article_data, p_notes);
    
    RETURN json_build_object('success', true, 'message', 'Article saved successfully');
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== GRANTS AND PERMISSIONS =====

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_saved_articles(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_article_safe(TEXT, JSONB, TEXT) TO authenticated;

-- ===== VERIFICATION =====

-- Function to verify news tables setup
CREATE OR REPLACE FUNCTION public.verify_news_tables_setup()
RETURNS TABLE(
    component TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check tables exist
    RETURN QUERY
    SELECT 
        'news_tables'::TEXT,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'news_preferences'
            ) AND EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'saved_articles'
            ) THEN 'OK'::TEXT
            ELSE 'MISSING'::TEXT
        END,
        'News preferences and saved articles tables created'::TEXT;
    
    -- Check RLS policies
    RETURN QUERY
    SELECT 
        'rls_policies'::TEXT,
        CASE 
            WHEN (
                SELECT COUNT(*) FROM pg_policies 
                WHERE tablename IN ('news_preferences', 'saved_articles') AND schemaname = 'public'
            ) >= 8 THEN 'OK'::TEXT
            ELSE 'INCOMPLETE'::TEXT
        END,
        'RLS policies configured for news tables'::TEXT;
    
    -- Check API functions
    RETURN QUERY
    SELECT 
        'api_functions'::TEXT,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM pg_proc p 
                JOIN pg_namespace n ON p.pronamespace = n.oid 
                WHERE n.nspname = 'public' AND p.proname = 'get_user_saved_articles'
            ) THEN 'OK'::TEXT
            ELSE 'MISSING'::TEXT
        END,
        'News API functions available'::TEXT;
    
    -- Check indexes
    RETURN QUERY
    SELECT 
        'indexes'::TEXT,
        CASE 
            WHEN (
                SELECT COUNT(*) FROM pg_indexes 
                WHERE tablename IN ('news_preferences', 'saved_articles') AND schemaname = 'public'
            ) >= 4 THEN 'OK'::TEXT
            ELSE 'INCOMPLETE'::TEXT
        END,
        'Performance indexes created'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run verification
SELECT * FROM public.verify_news_tables_setup();

-- Final log
DO $$
BEGIN
    RAISE LOG 'Legal news tables migration completed at %', NOW();
    RAISE LOG 'Created: news_preferences, saved_articles tables with RLS and API functions';
END $$;