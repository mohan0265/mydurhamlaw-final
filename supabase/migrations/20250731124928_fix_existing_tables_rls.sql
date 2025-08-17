-- Fix RLS for existing tables only
-- Only enable RLS for tables that already exist

-- Check and create missing essential tables first
CREATE TABLE IF NOT EXISTS public.wellbeing_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10),
    stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
    sleep_hours DECIMAL(3,1),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.study_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT,
    due_date TIMESTAMPTZ,
    completed BOOLEAN DEFAULT FALSE,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.delsa_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module_code TEXT NOT NULL,
    module_name TEXT NOT NULL,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    last_accessed TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.writing_samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    word_count INTEGER,
    category TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.writing_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    writing_style TEXT,
    preferred_tone TEXT,
    complexity_level TEXT DEFAULT 'intermediate' CHECK (complexity_level IN ('beginner', 'intermediate', 'advanced')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.writing_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    writing_sample_id UUID REFERENCES public.writing_samples(id) ON DELETE CASCADE,
    feedback_text TEXT NOT NULL,
    score INTEGER CHECK (score >= 1 AND score <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    category TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.voice_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Now enable RLS for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_voice_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellbeing_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delsa_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.writing_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.writing_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.writing_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_conversations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for all tables
-- WELLBEING_ENTRIES
CREATE POLICY "Users can view own wellbeing entries" ON public.wellbeing_entries
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wellbeing entries" ON public.wellbeing_entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wellbeing entries" ON public.wellbeing_entries
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own wellbeing entries" ON public.wellbeing_entries
    FOR DELETE USING (auth.uid() = user_id);

-- STUDY_TASKS
CREATE POLICY "Users can view own study tasks" ON public.study_tasks
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own study tasks" ON public.study_tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own study tasks" ON public.study_tasks
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own study tasks" ON public.study_tasks
    FOR DELETE USING (auth.uid() = user_id);

-- DELSA_PROGRESS
CREATE POLICY "Users can view own DELSA progress" ON public.delsa_progress
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own DELSA progress" ON public.delsa_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own DELSA progress" ON public.delsa_progress
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own DELSA progress" ON public.delsa_progress
    FOR DELETE USING (auth.uid() = user_id);

-- WRITING_SAMPLES
CREATE POLICY "Users can view own writing samples" ON public.writing_samples
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own writing samples" ON public.writing_samples
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own writing samples" ON public.writing_samples
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own writing samples" ON public.writing_samples
    FOR DELETE USING (auth.uid() = user_id);

-- WRITING_PREFERENCES
CREATE POLICY "Users can view own writing preferences" ON public.writing_preferences
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own writing preferences" ON public.writing_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own writing preferences" ON public.writing_preferences
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own writing preferences" ON public.writing_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- WRITING_FEEDBACK
CREATE POLICY "Users can view own writing feedback" ON public.writing_feedback
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own writing feedback" ON public.writing_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own writing feedback" ON public.writing_feedback
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own writing feedback" ON public.writing_feedback
    FOR DELETE USING (auth.uid() = user_id);

-- BOOKMARKS
CREATE POLICY "Users can view own bookmarks" ON public.bookmarks
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bookmarks" ON public.bookmarks
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookmarks" ON public.bookmarks
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bookmarks" ON public.bookmarks
    FOR DELETE USING (auth.uid() = user_id);

-- VOICE_CONVERSATIONS
CREATE POLICY "Users can view own voice conversations" ON public.voice_conversations
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own voice conversations" ON public.voice_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own voice conversations" ON public.voice_conversations
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own voice conversations" ON public.voice_conversations
    FOR DELETE USING (auth.uid() = user_id);