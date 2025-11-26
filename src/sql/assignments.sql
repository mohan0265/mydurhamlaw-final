-- Assignments Table Migration (Idempotent)
-- Stores student assignments and tasks. Safe to run on existing databases.

-- 1. Create table if it doesn't exist (Basic structure)
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add columns if they are missing (Safe for existing tables)
DO $$
BEGIN
    -- Add description
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'description') THEN
        ALTER TABLE public.assignments ADD COLUMN description TEXT;
    END IF;

    -- Add due_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'due_at') THEN
        ALTER TABLE public.assignments ADD COLUMN due_at TIMESTAMPTZ;
    END IF;

    -- Add status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'status') THEN
        ALTER TABLE public.assignments ADD COLUMN status TEXT CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending';
    END IF;
END $$;

-- 3. Enable RLS
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- 4. Recreate Policies (Drop first to avoid "already exists" errors)
DROP POLICY IF EXISTS "Users can view their own assignments" ON public.assignments;
CREATE POLICY "Users can view their own assignments" ON public.assignments
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own assignments" ON public.assignments;
CREATE POLICY "Users can insert their own assignments" ON public.assignments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own assignments" ON public.assignments;
CREATE POLICY "Users can update their own assignments" ON public.assignments
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own assignments" ON public.assignments;
CREATE POLICY "Users can delete their own assignments" ON public.assignments
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Create Indexes
CREATE INDEX IF NOT EXISTS idx_assignments_user_id ON public.assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_at ON public.assignments(due_at);
