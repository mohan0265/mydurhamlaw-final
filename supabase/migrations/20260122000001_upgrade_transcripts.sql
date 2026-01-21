-- Transcript Library Upgrade
-- Added Folders, Pinning, and Full-Text Search

BEGIN;

-- 1. Folders Table
CREATE TABLE IF NOT EXISTS public.transcript_folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3B82F6', -- Default blue
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT transcript_folders_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

-- 2. Folder Items (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.transcript_folder_items (
    folder_id UUID NOT NULL REFERENCES public.transcript_folders(id) ON DELETE CASCADE,
    journal_id UUID NOT NULL REFERENCES public.voice_journals(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (folder_id, journal_id)
);

-- 3. Add Columns to voice_journals
ALTER TABLE public.voice_journals 
    ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- 4. Full-Text Search
-- Add search_tsv column
ALTER TABLE public.voice_journals 
    ADD COLUMN IF NOT EXISTS search_tsv tsvector;

-- Function to generate search vector
CREATE OR REPLACE FUNCTION public.voice_journals_generate_tsv()
RETURNS TRIGGER AS $$
BEGIN
  -- We include Topic, Summary, and extract text from the Transcript JSONB
  -- Transcript JSONB format: [{"role": "you", "text": "..."}, {"role": "durmah", "text": "..."}]
  NEW.search_tsv := 
    setweight(to_tsvector('english', COALESCE(NEW.topic, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('english', (
      SELECT string_agg(msg->>'text', ' ')
      FROM jsonb_array_elements(NEW.transcript) AS msg
    )), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for TSV
DROP TRIGGER IF EXISTS trg_voice_journals_tsv ON public.voice_journals;
CREATE TRIGGER trg_voice_journals_tsv
    BEFORE INSERT OR UPDATE OF topic, summary, transcript
    ON public.voice_journals
    FOR EACH ROW EXECUTE FUNCTION public.voice_journals_generate_tsv();

-- Backfill TSV
UPDATE public.voice_journals SET updated_at = NOW();

-- Index for search
CREATE INDEX IF NOT EXISTS idx_voice_journals_search_tsv ON public.voice_journals USING GIN(search_tsv);

-- 5. RLS Policies

-- transcript_folders
ALTER TABLE public.transcript_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own folders" ON public.transcript_folders;
CREATE POLICY "Users can manage own folders" ON public.transcript_folders
    FOR ALL USING (auth.uid() = user_id);

-- transcript_folder_items
-- Since it links folders owned by the user, we check folder ownership
ALTER TABLE public.transcript_folder_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own folder items" ON public.transcript_folder_items;
CREATE POLICY "Users can manage own folder items" ON public.transcript_folder_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.transcript_folders
            WHERE id = folder_id AND user_id = auth.uid()
        )
    );

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_transcript_folders_user_id ON public.transcript_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_journals_pinned ON public.voice_journals(is_pinned) WHERE is_pinned = TRUE;

-- 7. Trigger to update transcript_folders updated_at
CREATE OR REPLACE FUNCTION public.update_transcript_folders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS transcript_folders_updated_at_trigger ON public.transcript_folders;
CREATE TRIGGER transcript_folders_updated_at_trigger
    BEFORE UPDATE ON public.transcript_folders
    FOR EACH ROW EXECUTE FUNCTION public.update_transcript_folders_updated_at();

COMMIT;
