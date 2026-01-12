-- Migration: Create My Lectures tables
-- Phase 1: lectures (metadata), lecture_transcripts (big text), lecture_notes (summaries)

-- Main lectures table (metadata only, no large text)
CREATE TABLE IF NOT EXISTS public.lectures (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module_code text,
    module_name text,
    lecturer_name text,
    title text NOT NULL,
    lecture_date date,
    audio_path text NOT NULL,
    audio_mime text,
    audio_duration_seconds integer,
    status text DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'transcribing', 'summarizing', 'ready', 'error')),
    error_message text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Transcript table (separate for large text, easier to chunk later)
CREATE TABLE IF NOT EXISTS public.lecture_transcripts (
    lecture_id uuid PRIMARY KEY REFERENCES public.lectures(id) ON DELETE CASCADE,
    transcript_text text NOT NULL,
    word_count integer,
    created_at timestamptz DEFAULT now()
);

-- Notes table (AI-generated summaries, key points, etc.)
CREATE TABLE IF NOT EXISTS public.lecture_notes (
    lecture_id uuid PRIMARY KEY REFERENCES public.lectures(id) ON DELETE CASCADE,
    summary text,
    key_points jsonb DEFAULT '[]'::jsonb,
    discussion_topics jsonb DEFAULT '[]'::jsonb,
    exam_prompts jsonb DEFAULT '[]'::jsonb,
    glossary jsonb DEFAULT '[]'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_lectures_user_id ON public.lectures(user_id);
CREATE INDEX IF NOT EXISTS idx_lectures_status ON public.lectures(status);
CREATE INDEX IF NOT EXISTS idx_lectures_module_code ON public.lectures(module_code);
CREATE INDEX IF NOT EXISTS idx_lectures_lecture_date ON public.lectures(lecture_date DESC);

-- RLS Policies
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecture_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecture_notes ENABLE ROW LEVEL SECURITY;

-- Lectures: User can only see/edit their own
CREATE POLICY "Users can view own lectures"
    ON public.lectures FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lectures"
    ON public.lectures FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lectures"
    ON public.lectures FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own lectures"
    ON public.lectures FOR DELETE
    USING (auth.uid() = user_id);

-- Transcripts: Access via join to lectures (user owns the lecture)
CREATE POLICY "Users can view transcripts of own lectures"
    ON public.lecture_transcripts FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.lectures 
        WHERE lectures.id = lecture_transcripts.lecture_id 
        AND lectures.user_id = auth.uid()
    ));

CREATE POLICY "Server can insert transcripts"
    ON public.lecture_transcripts FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.lectures 
        WHERE lectures.id = lecture_transcripts.lecture_id 
        AND lectures.user_id = auth.uid()
    ));

-- Notes: Access via join to lectures
CREATE POLICY "Users can view notes of own lectures"
    ON public.lecture_notes FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.lectures 
        WHERE lectures.id = lecture_notes.lecture_id 
        AND lectures.user_id = auth.uid()
    ));

CREATE POLICY "Server can insert notes"
    ON public.lecture_notes FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.lectures 
        WHERE lectures.id = lecture_notes.lecture_id 
        AND lectures.user_id = auth.uid()
    ));

-- Updated_at trigger for lectures
CREATE OR REPLACE FUNCTION update_lectures_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lectures_updated_at_trigger
    BEFORE UPDATE ON public.lectures
    FOR EACH ROW
    EXECUTE FUNCTION update_lectures_updated_at();
