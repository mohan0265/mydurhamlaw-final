-- Transcript Explorer Core: Nested Folders + Mapping + Search + Pin
-- Phase 1: Database Migration

BEGIN;

-- 1. Upgrade transcript_folders for recursion
ALTER TABLE public.transcript_folders 
    ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.transcript_folders(id) ON DELETE CASCADE;

-- 2. Add Unique constraint for Windows Explorer feel (name unique per parent)
-- Note: parent_id can be NULL (root). PostgreSQL unique constraint treats NULL as distinct,
-- so (user_id, NULL, 'name') and (user_id, NULL, 'name') would be allowed.
-- We need a partial index or a clever constraint to handle NULL parent_id.
ALTER TABLE public.transcript_folders DROP CONSTRAINT IF EXISTS transcript_folders_user_id_parent_id_name_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_transcript_folders_unique_null_parent 
    ON public.transcript_folders (user_id, name) 
    WHERE parent_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_transcript_folders_unique_with_parent 
    ON public.transcript_folders (user_id, parent_id, name) 
    WHERE parent_id IS NOT NULL;

-- 3. Upgrade transcript_folder_items
-- Ensure user_id exists for RLS optimization and security
ALTER TABLE public.transcript_folder_items 
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Backfill user_id from folders
UPDATE public.transcript_folder_items tfi
SET user_id = tf.user_id
FROM public.transcript_folders tf
WHERE tfi.folder_id = tf.id AND tfi.user_id IS NULL;

-- 4. Improve search_tsv backfill and trigger 
-- Ensure it handles content_text if we add it, or extracts correctly from transcript JSONB
-- For now, we continue with transcript JSONB as the source of truth for body content.

-- 5. Helper Function to Ensure "Unsorted" Folder
CREATE OR REPLACE FUNCTION public.get_or_create_unsorted_folder(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    v_folder_id UUID;
BEGIN
    SELECT id INTO v_folder_id 
    FROM public.transcript_folders 
    WHERE user_id = p_user_id AND parent_id IS NULL AND name = 'Unsorted';
    
    IF v_folder_id IS NULL THEN
        INSERT INTO public.transcript_folders (user_id, name, color)
        VALUES (p_user_id, 'Unsorted', '#94A3B8')
        RETURNING id INTO v_folder_id;
    END IF;
    
    RETURN v_folder_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Updated RLS Policies
-- transcript_folder_items policy should be simpler with user_id on the table
DROP POLICY IF EXISTS "Users can manage own folder items" ON public.transcript_folder_items;
CREATE POLICY "Users can manage own folder items" ON public.transcript_folder_items
    FOR ALL USING (auth.uid() = user_id);

-- 7. Add content_text column to voice_journals if not already present
-- This helps with simpler searching and external tools that don't speak JSONB well.
ALTER TABLE public.voice_journals 
    ADD COLUMN IF NOT EXISTS content_text TEXT;

-- Update trigger to index content_text if present, else fallback to JSONB
CREATE OR REPLACE FUNCTION public.voice_journals_generate_tsv()
RETURNS TRIGGER AS $$
BEGIN
  -- We include Topic, Summary, and either content_text or transcript JSONB
  NEW.search_tsv := 
    setweight(to_tsvector('english', COALESCE(NEW.topic, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(
        NEW.content_text, 
        (SELECT string_agg(msg->>'text', ' ') FROM jsonb_array_elements(NEW.transcript) AS msg)
    )), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;
