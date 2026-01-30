-- Create academic_items table
CREATE TABLE IF NOT EXISTS public.academic_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('lecture', 'assignment', 'event', 'quiz', 'note', 'revision')),
    title TEXT NOT NULL,
    description TEXT,
    occurred_at TIMESTAMP WITH TIME ZONE, -- Lecture date, due date, or event start
    module_id UUID REFERENCES public.modules(id) ON DELETE SET NULL,
    
    -- Source tracking for blind upserts and linking
    source_refs JSONB DEFAULT '{}'::jsonb,
    
    -- Unified state machine
    state JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_academic_items_user_date ON public.academic_items(user_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_academic_items_refs ON public.academic_items USING gyn (source_refs);
CREATE INDEX IF NOT EXISTS idx_academic_items_type ON public.academic_items(type);

-- Enable RLS
ALTER TABLE public.academic_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own academic items"
    ON public.academic_items FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own academic items"
    ON public.academic_items FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own academic items"
    ON public.academic_items FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own academic items"
    ON public.academic_items FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_academic_items_updated_at
    BEFORE UPDATE ON public.academic_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
