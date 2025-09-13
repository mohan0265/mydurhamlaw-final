-- Voice Journals Table for Voice Chat Feature
-- This migration creates the voice_journals table for storing voice chat sessions

-- ===== VOICE JOURNALS TABLE =====

-- Create voice_journals table
CREATE TABLE IF NOT EXISTS public.voice_journals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transcript TEXT NOT NULL,
    gpt_response TEXT NOT NULL,
    session_duration INTEGER DEFAULT 0, -- Duration in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT voice_journals_transcript_not_empty CHECK (LENGTH(TRIM(transcript)) > 0),
    CONSTRAINT voice_journals_response_not_empty CHECK (LENGTH(TRIM(gpt_response)) > 0),
    CONSTRAINT voice_journals_duration_positive CHECK (session_duration >= 0)
);

-- ===== INDEXES FOR PERFORMANCE =====

-- Index for user queries (most common)
CREATE INDEX IF NOT EXISTS idx_voice_journals_user_id ON public.voice_journals(user_id);

-- Index for recent entries
CREATE INDEX IF NOT EXISTS idx_voice_journals_created_at ON public.voice_journals(created_at DESC);

-- Composite index for user's recent journals
CREATE INDEX IF NOT EXISTS idx_voice_journals_user_recent ON public.voice_journals(user_id, created_at DESC);

-- ===== ROW LEVEL SECURITY =====

-- Enable RLS
ALTER TABLE public.voice_journals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own voice journals
CREATE POLICY "Users can view own voice journals" ON public.voice_journals
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Policy: Users can create their own voice journals
CREATE POLICY "Users can create own voice journals" ON public.voice_journals
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own voice journals
CREATE POLICY "Users can update own voice journals" ON public.voice_journals
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own voice journals
CREATE POLICY "Users can delete own voice journals" ON public.voice_journals
    FOR DELETE 
    USING (auth.uid() = user_id);

-- ===== TRIGGERS =====

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_voice_journals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER voice_journals_updated_at_trigger
    BEFORE UPDATE ON public.voice_journals
    FOR EACH ROW EXECUTE FUNCTION public.update_voice_journals_updated_at();

-- ===== API HELPER FUNCTIONS =====

-- Function to create a voice journal entry
CREATE OR REPLACE FUNCTION public.create_voice_journal(
    p_transcript TEXT,
    p_gpt_response TEXT,
    p_session_duration INTEGER DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
    user_id UUID;
    journal_id UUID;
    result JSON;
BEGIN
    -- Get current user ID
    user_id := auth.uid();
    
    IF user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Not authenticated');
    END IF;
    
    -- Validate inputs
    IF p_transcript IS NULL OR LENGTH(TRIM(p_transcript)) = 0 THEN
        RETURN json_build_object('success', false, 'error', 'Transcript cannot be empty');
    END IF;
    
    IF p_gpt_response IS NULL OR LENGTH(TRIM(p_gpt_response)) = 0 THEN
        RETURN json_build_object('success', false, 'error', 'GPT response cannot be empty');
    END IF;
    
    -- Create voice journal entry
    BEGIN
        INSERT INTO public.voice_journals (
            user_id,
            transcript,
            gpt_response,
            session_duration
        ) VALUES (
            user_id,
            TRIM(p_transcript),
            TRIM(p_gpt_response),
            COALESCE(p_session_duration, 0)
        ) RETURNING id INTO journal_id;
        
        result := json_build_object(
            'success', true,
            'journal_id', journal_id,
            'message', 'Voice journal created successfully'
        );
        
    EXCEPTION WHEN OTHERS THEN
        result := json_build_object(
            'success', false,
            'error', SQLERRM
        );
    END;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's recent voice journals
CREATE OR REPLACE FUNCTION public.get_user_voice_journals(
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
    
    -- Get journals with pagination
    SELECT json_build_object(
        'success', true,
        'journals', json_agg(
            json_build_object(
                'id', id,
                'transcript', transcript,
                'gpt_response', gpt_response,
                'session_duration', session_duration,
                'created_at', created_at
            ) ORDER BY created_at DESC
        ),
        'total_count', (
            SELECT COUNT(*) FROM public.voice_journals WHERE user_id = get_user_voice_journals.user_id
        )
    ) INTO result
    FROM (
        SELECT *
        FROM public.voice_journals
        WHERE user_id = get_user_voice_journals.user_id
        ORDER BY created_at DESC
        LIMIT p_limit OFFSET p_offset
    ) limited_journals;
    
    RETURN COALESCE(result, json_build_object('success', true, 'journals', '[]'::json, 'total_count', 0));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== ANALYTICS AND MONITORING =====

-- View for voice journal analytics
CREATE OR REPLACE VIEW public.voice_journal_stats AS
SELECT 
    COUNT(*) as total_sessions,
    COUNT(DISTINCT user_id) as unique_users,
    AVG(session_duration) as avg_duration_seconds,
    AVG(LENGTH(transcript)) as avg_transcript_length,
    AVG(LENGTH(gpt_response)) as avg_response_length,
    DATE_TRUNC('day', created_at) as date
FROM public.voice_journals
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- ===== GRANTS AND PERMISSIONS =====

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.create_voice_journal(TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_voice_journals(INTEGER, INTEGER) TO authenticated;

-- Grant view access to admins only
GRANT SELECT ON public.voice_journal_stats TO postgres;

-- ===== VERIFICATION =====

-- Function to verify voice journals setup
CREATE OR REPLACE FUNCTION public.verify_voice_journals_setup()
RETURNS TABLE(
    component TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check table exists
    RETURN QUERY
    SELECT 
        'voice_journals_table'::TEXT,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'voice_journals'
            ) THEN 'OK'::TEXT
            ELSE 'MISSING'::TEXT
        END,
        'Voice journals table created'::TEXT;
    
    -- Check RLS policies
    RETURN QUERY
    SELECT 
        'rls_policies'::TEXT,
        CASE 
            WHEN (
                SELECT COUNT(*) FROM pg_policies 
                WHERE tablename = 'voice_journals' AND schemaname = 'public'
            ) >= 4 THEN 'OK'::TEXT
            ELSE 'INCOMPLETE'::TEXT
        END,
        'RLS policies configured'::TEXT;
    
    -- Check API functions
    RETURN QUERY
    SELECT 
        'api_functions'::TEXT,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM pg_proc p 
                JOIN pg_namespace n ON p.pronamespace = n.oid 
                WHERE n.nspname = 'public' AND p.proname = 'create_voice_journal'
            ) THEN 'OK'::TEXT
            ELSE 'MISSING'::TEXT
        END,
        'API functions available'::TEXT;
    
    -- Check indexes
    RETURN QUERY
    SELECT 
        'indexes'::TEXT,
        CASE 
            WHEN (
                SELECT COUNT(*) FROM pg_indexes 
                WHERE tablename = 'voice_journals' AND schemaname = 'public'
            ) >= 3 THEN 'OK'::TEXT
            ELSE 'INCOMPLETE'::TEXT
        END,
        'Performance indexes created'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run verification
SELECT * FROM public.verify_voice_journals_setup();

-- Final log
DO $$
BEGIN
    RAISE LOG 'Voice journals table migration completed at %', NOW();
    RAISE LOG 'Created: voice_journals table, RLS policies, API functions, indexes';
END $$;