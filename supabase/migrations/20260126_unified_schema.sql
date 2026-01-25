-- Migration: Unified Module Schema & Exam Prep
-- Date: 2026-01-26
-- Description: Consolidates modules, backfills legacy data, and sets up EW pipeline.

BEGIN;

-- 1. Create canonical MODULES table
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    code TEXT,
    term TEXT CHECK (term IN ('Michaelmas', 'Epiphany', 'Easter')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, code) -- Ensure one module entry per code per user
);

CREATE INDEX IF NOT EXISTS idx_modules_user ON public.modules(user_id);
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own modules" ON public.modules
    FOR ALL USING (auth.uid() = user_id);

-- 2. BACKFILL: Populate modules from legacy data (lectures, assignments, quizzes)
-- We use DISTINCT code/title pairs from existing tables.
INSERT INTO public.modules (user_id, title, code)
SELECT DISTINCT user_id, COALESCE(module_name, module_code, 'Unknown Module') as title, module_code
FROM (
    SELECT user_id, module_name, module_code FROM public.assignments WHERE module_code IS NOT NULL
    UNION
    SELECT user_id, module_name, module_code FROM public.lectures WHERE module_code IS NOT NULL
    UNION
    SELECT user_id, NULL as module_name, module_code FROM public.quiz_sessions WHERE module_code IS NOT NULL
) as legacy_data
ON CONFLICT (user_id, code) DO NOTHING;

-- 3. Add module_id to existing tables & Link
-- Lectures
ALTER TABLE public.lectures ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_lectures_module ON public.lectures(module_id);

UPDATE public.lectures l
SET module_id = m.id
FROM public.modules m
WHERE l.user_id = m.user_id AND l.module_code = m.code
AND l.module_id IS NULL;

-- Assignments
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_assignments_module ON public.assignments(module_id);

UPDATE public.assignments a
SET module_id = m.id
FROM public.modules m
WHERE a.user_id = m.user_id AND a.module_code = m.code
AND a.module_id IS NULL;

-- Quiz Sessions
ALTER TABLE public.quiz_sessions ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_module ON public.quiz_sessions(module_id);

UPDATE public.quiz_sessions q
SET module_id = m.id
FROM public.modules m
WHERE q.user_id = m.user_id AND q.module_code = m.code
AND q.module_id IS NULL;

-- 4. Module Lecture Sets (The "Unlock" Tracker)
CREATE TABLE IF NOT EXISTS public.module_lecture_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    expected_count INTEGER DEFAULT 0 CHECK (expected_count >= 0),
    uploaded_count INTEGER DEFAULT 0 CHECK (uploaded_count >= 0),
    is_complete BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_lecture_sets_user ON public.module_lecture_sets(user_id);
ALTER TABLE public.module_lecture_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own lecture sets" ON public.module_lecture_sets FOR ALL USING (auth.uid() = user_id);

-- 5. Exam Workspaces (The "EW" Container)
CREATE TABLE IF NOT EXISTS public.exam_workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_reason TEXT DEFAULT 'lecture_set_completed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_workspaces_status ON public.exam_workspaces(status);
ALTER TABLE public.exam_workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own workspaces" ON public.exam_workspaces FOR ALL USING (auth.uid() = user_id);

-- 6. Exam Artifacts (Generated Content)
CREATE TABLE IF NOT EXISTS public.exam_artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES public.exam_workspaces(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('issue_map','rule_cards','problem_questions','model_outline','checklist','flashcards','mini_moot','past_paper_plan','notes')),
    title TEXT NOT NULL,
    content_md TEXT NOT NULL,
    source_refs JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.exam_artifacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own artifacts" ON public.exam_artifacts FOR ALL USING (auth.uid() = user_id);

-- 7. Exam Workspace State (Resume UI)
CREATE TABLE IF NOT EXISTS public.exam_workspace_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES public.exam_workspaces(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    last_tab TEXT DEFAULT 'plan',
    last_artifact_id UUID,
    last_scroll_anchor TEXT,
    last_opened_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, workspace_id)
);
ALTER TABLE public.exam_workspace_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own state" ON public.exam_workspace_state FOR ALL USING (auth.uid() = user_id);

-- 8. Exam Sessions (Transcript History)
CREATE TABLE IF NOT EXISTS public.exam_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES public.exam_workspaces(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    session_title TEXT DEFAULT 'Revision Session',
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sessions" ON public.exam_sessions FOR ALL USING (auth.uid() = user_id);

-- 9. Exam Messages (Transcript Content)
CREATE TABLE IF NOT EXISTS public.exam_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES public.exam_workspaces(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('student', 'durmah', 'system')),
    message_md TEXT NOT NULL,
    artifact_id UUID,
    source_refs JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.exam_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own messages" ON public.exam_messages FOR ALL USING (auth.uid() = user_id);

-- 10. Triggers for Counts and Updates

-- Function: update uploaded_count
CREATE OR REPLACE FUNCTION update_module_lecture_list_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Determine module_id (could be NEW or OLD depending on op)
    DECLARE
        target_module_id UUID;
    BEGIN
        IF (TG_OP = 'DELETE') THEN
            target_module_id := OLD.module_id;
        ELSE
            target_module_id := NEW.module_id;
        END IF;

        IF target_module_id IS NOT NULL THEN
            -- Update count
            UPDATE public.module_lecture_sets
            SET uploaded_count = (
                SELECT count(*) FROM public.lectures 
                WHERE module_id = target_module_id
            ),
            updated_at = NOW()
            WHERE module_id = target_module_id;
            
            -- Check completion logic is handled by API or separate trigger?
            -- Let's do it here:
            UPDATE public.module_lecture_sets
            SET is_complete = (uploaded_count >= expected_count AND expected_count > 0),
                completed_at = CASE 
                    WHEN (uploaded_count >= expected_count AND expected_count > 0) AND completed_at IS NULL THEN NOW()
                    ELSE completed_at
                END
            WHERE module_id = target_module_id;
        END IF;
    END;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lecture_count
AFTER INSERT OR DELETE OR UPDATE OF module_id ON public.lectures
FOR EACH ROW EXECUTE FUNCTION update_module_lecture_list_count();

-- Function: Auto-create Exam Workspace on completion
CREATE OR REPLACE FUNCTION auto_create_exam_workspace()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_complete = TRUE AND (OLD.is_complete = FALSE OR OLD.is_complete IS NULL) THEN
        INSERT INTO public.exam_workspaces (user_id, module_id, status)
        VALUES (NEW.user_id, NEW.module_id, 'active')
        ON CONFLICT (user_id, module_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_unlock_exam_prep
AFTER UPDATE ON public.module_lecture_sets
FOR EACH ROW EXECUTE FUNCTION auto_create_exam_workspace();

-- Generic updated_at trigger reuse
CREATE TRIGGER update_modules_timestamp BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION update_lectures_updated_at();

COMMIT;
