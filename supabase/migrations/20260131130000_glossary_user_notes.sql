-- Create glossary_user_notes table for reinforced learning
CREATE TABLE IF NOT EXISTS public.glossary_user_notes (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES public.glossary_terms(id) ON DELETE CASCADE,
    notes TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, term_id)
);

-- RLS Policies
ALTER TABLE public.glossary_user_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own glossary notes"
    ON public.glossary_user_notes
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Indices
CREATE INDEX idx_glossary_user_notes_user_id ON public.glossary_user_notes(user_id);
CREATE INDEX idx_glossary_user_notes_term_id ON public.glossary_user_notes(term_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_glossary_user_notes_updated_at
    BEFORE UPDATE ON public.glossary_user_notes
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
