-- Migration: Quiz Me (Durmah Quiz Mode) Foundation
-- Created: 2026-01-24
-- Purpose: Data structure for grounded quizzes and provenance

BEGIN;

-- 1. Durham Academic Content (The "Durham DB" Grounding)
CREATE TABLE IF NOT EXISTS public.durham_academic_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_code TEXT NOT NULL,
    year INTEGER NOT NULL CHECK (year IN (1, 2, 3)),
    title TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('topic', 'outcome', 'summary', 'reading_list')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast module + type lookups
CREATE INDEX IF NOT EXISTS idx_academic_content_module ON public.durham_academic_content(module_code);
CREATE INDEX IF NOT EXISTS idx_academic_content_type ON public.durham_academic_content(content_type);

-- 2. Quiz Sessions
CREATE TABLE IF NOT EXISTS public.quiz_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module_code TEXT,
    quiz_type TEXT NOT NULL CHECK (quiz_type IN ('module', 'lecture', 'assignment', 'general')),
    target_id UUID, -- References lecture_id or assignment_id if applicable
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    performance_metadata JSONB DEFAULT '{}'::jsonb, -- Store score, topics covered, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user ON public.quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_status ON public.quiz_sessions(status);

-- 3. Quiz Messages
CREATE TABLE IF NOT EXISTS public.quiz_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_quiz_messages_session ON public.quiz_messages(session_id);

-- 4. Quiz Message Sources (Provenance / Evidence)
CREATE TABLE IF NOT EXISTS public.quiz_message_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.quiz_messages(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL CHECK (source_type IN ('academic_content', 'lecture', 'assignment', 'legal_news')),
    source_id UUID, -- Reference to the specific source row
    content_snippet TEXT,
    relevance_score FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_sources_message ON public.quiz_message_sources(message_id);

-- 5. Row Level Security (RLS)
ALTER TABLE public.durham_academic_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_message_sources ENABLE ROW LEVEL SECURITY;

-- Academic Content: Public read for all authenticated users
CREATE POLICY "Public academic content readable by all"
    ON public.durham_academic_content FOR SELECT
    TO authenticated
    USING (true);

-- Quiz Sessions: Owned by user
CREATE POLICY "Users can manage own quiz sessions"
    ON public.quiz_sessions FOR ALL
    USING (auth.uid() = user_id);

-- Quiz Messages: Owned by user
CREATE POLICY "Users can manage own quiz messages"
    ON public.quiz_messages FOR ALL
    USING (auth.uid() = user_id);

-- Quiz Sources: Accessible if the user owns the message
CREATE POLICY "Users can view sources for own messages"
    ON public.quiz_message_sources FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.quiz_messages
        WHERE quiz_messages.id = quiz_message_sources.message_id
        AND quiz_messages.user_id = auth.uid()
    ));

-- 6. Updated At Trigger
CREATE OR REPLACE FUNCTION public.update_quiz_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_academic_content_updated_at
    BEFORE UPDATE ON public.durham_academic_content
    FOR EACH ROW EXECUTE FUNCTION public.update_quiz_updated_at();

CREATE TRIGGER trigger_update_quiz_sessions_updated_at
    BEFORE UPDATE ON public.quiz_sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_quiz_updated_at();

COMMIT;
