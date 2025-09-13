-- Add missing critical tables and fix major security issues

-- ASSIGNMENTS TABLE - if it exists but has no RLS, we need to fix it
DO $$
BEGIN
    -- Check if assignments table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assignments') THEN
        -- Enable RLS if not already enabled
        ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist and recreate them correctly
        DROP POLICY IF EXISTS "Users can view own assignments" ON public.assignments;
        DROP POLICY IF EXISTS "Users can insert own assignments" ON public.assignments;
        DROP POLICY IF EXISTS "Users can update own assignments" ON public.assignments;
        DROP POLICY IF EXISTS "Users can delete own assignments" ON public.assignments;
        
        -- Create correct RLS policies
        CREATE POLICY "Users can view own assignments" ON public.assignments
            FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert own assignments" ON public.assignments
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update own assignments" ON public.assignments
            FOR UPDATE USING (auth.uid() = user_id);
        CREATE POLICY "Users can delete own assignments" ON public.assignments
            FOR DELETE USING (auth.uid() = user_id);
    ELSE
        -- Create the table if it doesn't exist
        CREATE TABLE public.assignments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT,
            due_date TIMESTAMPTZ,
            completed BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view own assignments" ON public.assignments
            FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert own assignments" ON public.assignments
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update own assignments" ON public.assignments
            FOR UPDATE USING (auth.uid() = user_id);
        CREATE POLICY "Users can delete own assignments" ON public.assignments
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END
$$;

-- MEMORY_LOGS TABLE
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'memory_logs') THEN
        CREATE TABLE public.memory_logs (
            id SERIAL PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            note TEXT NOT NULL,
            mood TEXT DEFAULT '=',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        ALTER TABLE public.memory_logs ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view own memory logs" ON public.memory_logs
            FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert own memory logs" ON public.memory_logs
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update own memory logs" ON public.memory_logs
            FOR UPDATE USING (auth.uid() = user_id);
        CREATE POLICY "Users can delete own memory logs" ON public.memory_logs
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END
$$;

-- MEMORY_NOTES TABLE
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'memory_notes') THEN
        CREATE TABLE public.memory_notes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        ALTER TABLE public.memory_notes ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view own memory notes" ON public.memory_notes
            FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert own memory notes" ON public.memory_notes
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update own memory notes" ON public.memory_notes
            FOR UPDATE USING (auth.uid() = user_id);
        CREATE POLICY "Users can delete own memory notes" ON public.memory_notes
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END
$$;

-- AI_HISTORY TABLE
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_history') THEN
        CREATE TABLE public.ai_history (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            conversation_id UUID,
            role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
            content TEXT NOT NULL,
            timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        ALTER TABLE public.ai_history ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view own AI history" ON public.ai_history
            FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert own AI history" ON public.ai_history
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update own AI history" ON public.ai_history
            FOR UPDATE USING (auth.uid() = user_id);
        CREATE POLICY "Users can delete own AI history" ON public.ai_history
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END
$$;

-- Storage bucket and policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies and recreate them
DROP POLICY IF EXISTS "Users can upload own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile pictures" ON storage.objects;

CREATE POLICY "Users can upload own profile pictures" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own profile pictures" ON storage.objects
    FOR SELECT USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own profile pictures" ON storage.objects
    FOR UPDATE USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own profile pictures" ON storage.objects
    FOR DELETE USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);