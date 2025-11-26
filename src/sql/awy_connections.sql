-- AWY Connections Table
-- Stores relationships between students and their loved ones

CREATE TABLE IF NOT EXISTS public.awy_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    loved_email TEXT NOT NULL,
    display_name TEXT,
    relationship TEXT,
    status TEXT CHECK (status IN ('active', 'pending', 'blocked')) DEFAULT 'active',
    is_visible BOOLEAN DEFAULT true,
    loved_one_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, loved_email)
);

-- Enable RLS
ALTER TABLE public.awy_connections ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own connections" ON public.awy_connections
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Users can insert their own connections" ON public.awy_connections
    FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users can update their own connections" ON public.awy_connections
    FOR UPDATE USING (auth.uid() = student_id);

CREATE POLICY "Users can delete their own connections" ON public.awy_connections
    FOR DELETE USING (auth.uid() = student_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_awy_connections_student_id ON public.awy_connections(student_id);
CREATE INDEX IF NOT EXISTS idx_awy_connections_loved_email ON public.awy_connections(loved_email);
