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
    BEFORE INSERT OR UPDATE
    ON public.voice_journals
    FOR EACH ROW EXECUTE FUNCTION public.voice_journals_generate_tsv();

-- 3. Backfill content_text where missing
UPDATE public.voice_journals 
SET content_text = (
    SELECT string_agg(msg->>'text', ' ') 
    FROM jsonb_array_elements(transcript) AS msg
)
WHERE (content_text IS NULL OR content_text = '') 
AND transcript IS NOT NULL 
AND jsonb_array_length(transcript) > 0;

-- 4. Force re-generation of all search_tsv
-- This will fire the trigger and update search_tsv for every row
UPDATE public.voice_journals 
SET updated_at = NOW();

COMMIT;
