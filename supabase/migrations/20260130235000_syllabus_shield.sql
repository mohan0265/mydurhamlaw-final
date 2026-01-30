-- Migration: SyllabusShield™ Module Coverage Intelligence
-- Date: 2026-01-30

-- 1. Create module_topics table
CREATE TABLE IF NOT EXISTS public.module_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES public.module_catalog(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INT NOT NULL DEFAULT 0,
    importance_weight INT NOT NULL DEFAULT 1, -- 1=normal, 2=high
    keywords TEXT[] DEFAULT '{}'::TEXT[],
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(module_id, user_id, order_index)
);

-- 2. Create lecture_topic_coverage table
CREATE TABLE IF NOT EXISTS public.lecture_topic_coverage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.module_catalog(id) ON DELETE CASCADE,
    lecture_item_id UUID NOT NULL REFERENCES public.academic_items(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES public.module_topics(id) ON DELETE CASCADE,
    confidence NUMERIC(4,3) NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 1),
    evidence JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(lecture_item_id, topic_id)
);

-- 3. Create module_coverage_rollups table
CREATE TABLE IF NOT EXISTS public.module_coverage_rollups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.module_catalog(id) ON DELETE CASCADE,
    total_topics INT NOT NULL DEFAULT 0,
    covered_topics INT NOT NULL DEFAULT 0,
    coverage_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
    missing_topics JSONB NOT NULL DEFAULT '[]'::jsonb,
    missing_high_importance JSONB NOT NULL DEFAULT '[]'::jsonb,
    last_computed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, module_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_module_topics_module ON public.module_topics(module_id);
CREATE INDEX IF NOT EXISTS idx_lecture_topic_coverage_user_id ON public.lecture_topic_coverage(user_id);
CREATE INDEX IF NOT EXISTS idx_lecture_topic_coverage_lecture ON public.lecture_topic_coverage(lecture_item_id);
CREATE INDEX IF NOT EXISTS idx_module_coverage_rollups_user_module ON public.module_coverage_rollups(user_id, module_id);

-- RLS
ALTER TABLE public.module_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecture_topic_coverage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_coverage_rollups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own module topics" ON public.module_topics
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own lecture coverage" ON public.lecture_topic_coverage
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own coverage rollups" ON public.module_coverage_rollups
    FOR ALL USING (auth.uid() = user_id);

-- updated_at Trigger
CREATE TRIGGER update_module_topics_updated_at
    BEFORE UPDATE ON public.module_topics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_module_coverage_rollups_updated_at
    BEFORE UPDATE ON public.module_coverage_rollups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
