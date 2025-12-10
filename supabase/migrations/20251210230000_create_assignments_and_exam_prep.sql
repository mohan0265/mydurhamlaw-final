-- Create assignments table
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    module_code TEXT,
    module_name TEXT,
    assignment_type TEXT,
    question_text TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    status TEXT CHECK (status IN ('not_started', 'planning', 'drafting', 'editing', 'submitted', 'completed')) DEFAULT 'not_started',
    estimated_effort_hours NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on assignments
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Create policy for assignments
CREATE POLICY "Users can manage their own assignments"
ON public.assignments
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create exam_preparation table
CREATE TABLE IF NOT EXISTS public.exam_preparation (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module_code TEXT,
    module_name TEXT,
    exam_date TIMESTAMPTZ NOT NULL,
    readiness_score INTEGER CHECK (readiness_score BETWEEN 1 AND 5),
    syllabus_covered BOOLEAN DEFAULT FALSE,
    past_papers_practised INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on exam_preparation
ALTER TABLE public.exam_preparation ENABLE ROW LEVEL SECURITY;

-- Create policy for exam_preparation
CREATE POLICY "Users can manage their own exam preparation"
ON public.exam_preparation
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assignments_user_id ON public.assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_preparation_user_id ON public.exam_preparation(user_id);
