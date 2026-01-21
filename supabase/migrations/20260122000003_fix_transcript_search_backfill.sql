-- Fix Transcript Search Backfill
-- Ensures content_text is populated and search_tsv is re-generated for existing items

BEGIN;

-- 1. Update the Search Generation Function to be more robust
CREATE OR REPLACE FUNCTION public.voice_journals_generate_tsv()
RETURNS TRIGGER AS $$
DECLARE
    t_body TEXT;
BEGIN
    -- Prefer content_text if available
    t_body := COALESCE(NEW.content_text, '');
    
    -- If content_text is empty but transcript JSONB has data, extract it
    IF (t_body = '' AND NEW.transcript IS NOT NULL AND jsonb_array_length(NEW.transcript) > 0) THEN
        SELECT string_agg(msg->>'text', ' ') INTO t_body
        FROM jsonb_array_elements(NEW.transcript) AS msg;
    END IF;

    -- Update search_tsv with weighted components
    NEW.search_tsv := 
        setweight(to_tsvector('english', COALESCE(NEW.topic, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.summary, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(t_body, '')), 'C');
        
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Update trigger to include content_text in the "OF" list
DROP TRIGGER IF EXISTS trg_voice_journals_tsv ON public.voice_journals;
CREATE TRIGGER trg_voice_journals_tsv
    BEFORE INSERT OR UPDATE OF topic, summary, transcript, content_text
    ON public.voice_journals
    FOR EACH ROW EXECUTE FUNCTION public.voice_journals_generate_tsv();

-- 3. Backfill content_text and fire triggers explicitly
-- Use the exact command requested for firing triggers
UPDATE public.voice_journals SET transcript = transcript, content_text = content_text;

-- 4. Helper for Recursive Folder Search (Phase C Support)
CREATE OR REPLACE FUNCTION public.get_folder_descendants(p_folder_id UUID)
RETURNS TABLE (folder_id UUID) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE descendants AS (
        SELECT f.id FROM public.transcript_folders f WHERE f.id = p_folder_id
        UNION ALL
        SELECT f.id FROM public.transcript_folders f
        JOIN descendants d ON f.parent_id = d.id
    )
    SELECT d.id FROM descendants d;
END;
$$ LANGUAGE plpgsql STABLE;

COMMIT;
