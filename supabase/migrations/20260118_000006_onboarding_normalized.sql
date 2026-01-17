-- Migration: 20260118_000006_onboarding_normalized.sql
-- Description: creating normalized onboarding_tasks and user_onboarding_tasks tables

-- 1) Create onboarding_tasks table (Static definitions)
CREATE TABLE IF NOT EXISTS public.onboarding_tasks (
    task_key TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    description TEXT,
    href TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    optional BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2) Create user_onboarding_tasks table (Per-user completion)
CREATE TABLE IF NOT EXISTS public.user_onboarding_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    task_key TEXT NOT NULL REFERENCES public.onboarding_tasks(task_key) ON DELETE CASCADE,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, task_key)
);

-- 3) Indexes
CREATE INDEX IF NOT EXISTS idx_user_onboarding_tasks_user_id ON public.user_onboarding_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_tasks_key ON public.user_onboarding_tasks(task_key);

-- 4) RLS Policies
ALTER TABLE public.onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_onboarding_tasks ENABLE ROW LEVEL SECURITY;

-- onboarding_tasks: Readable by everyone (authenticated), mostly static
CREATE POLICY "Enable read access for all users" ON public.onboarding_tasks
    FOR SELECT USING (auth.role() = 'authenticated');

-- user_onboarding_tasks: Users can only manage their own rows
CREATE POLICY "Users can view own progress" ON public.user_onboarding_tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON public.user_onboarding_tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.user_onboarding_tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress" ON public.user_onboarding_tasks
    FOR DELETE USING (auth.uid() = user_id);

-- 5) updated_at Triggers
CREATE OR REPLACE FUNCTION update_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_onboarding_tasks_updated
    BEFORE UPDATE ON public.onboarding_tasks
    FOR EACH ROW EXECUTE FUNCTION update_onboarding_updated_at();

CREATE TRIGGER update_user_onboarding_tasks_updated
    BEFORE UPDATE ON public.user_onboarding_tasks
    FOR EACH ROW EXECUTE FUNCTION update_onboarding_updated_at();

-- 6) Seed Data
INSERT INTO public.onboarding_tasks (task_key, label, description, href, sort_order, optional)
VALUES
    ('connect_timetable', 'Connect your timetable', 'Import your ICS calendar or sync with Durham timetable.', '/profile-timetable', 10, FALSE),
    ('add_first_assignment', 'Add your first assignment', 'Track deadlines and structure your work.', '/assignments', 20, FALSE),
    ('add_first_lecture', 'Add your first lecture', 'Upload a recording or import from Panopto.', '/study/lectures', 30, FALSE),
    ('try_durmah', 'Ask Durmah a question', 'Get instant answers from your AI legal buddy.', '/dashboard', 40, FALSE),
    ('setup_awy', 'Connect with a loved one', 'Add family or friends to Always With You.', '/profile-timetable', 50, TRUE), -- Assuming AWY setup is in profile or dashboard
    ('explore_legal_news', 'Explore Legal News', 'Stay updated with the latest legal developments.', '/news', 60, TRUE)
ON CONFLICT (task_key) DO UPDATE SET
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    href = EXCLUDED.href,
    sort_order = EXCLUDED.sort_order,
    optional = EXCLUDED.optional;
