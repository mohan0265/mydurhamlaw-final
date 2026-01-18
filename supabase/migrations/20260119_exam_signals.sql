-- Migration: Add Exam Signals support
-- 1. Add exam_signals to lecture_notes
ALTER TABLE public.lecture_notes 
ADD COLUMN IF NOT EXISTS exam_signals jsonb DEFAULT '[]'::jsonb;

-- 2. Create revision_items table for "Add to Revision" feature
CREATE TABLE IF NOT EXISTS public.revision_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    lecture_id uuid REFERENCES public.lectures(id) ON DELETE CASCADE,
    topic_title text NOT NULL,
    notes text,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.revision_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own revision items"
    ON public.revision_items FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own revision items"
    ON public.revision_items FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own revision items"
    ON public.revision_items FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own revision items"
    ON public.revision_items FOR DELETE
    USING (auth.uid() = user_id);
