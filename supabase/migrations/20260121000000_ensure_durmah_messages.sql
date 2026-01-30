-- Ensure durmah_messages exists
CREATE TABLE IF NOT EXISTS public.durmah_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL, -- Logical grouping
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Context Metadata
    source TEXT DEFAULT 'widget', -- 'widget', 'lecture', 'assignment'
    scope TEXT DEFAULT 'global', -- 'global', 'lecture', 'assignment'
    scope_id UUID, -- Optional foreign key ID if relevant (e.g. lecture_id)
    modality TEXT DEFAULT 'text', -- 'text', 'voice'

    -- Save/Review features
    visibility TEXT DEFAULT 'ephemeral', -- 'ephemeral', 'saved', 'archived'
    saved_at TIMESTAMPTZ,
    context JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.durmah_messages ENABLE ROW LEVEL SECURITY;

-- create indexes
CREATE INDEX IF NOT EXISTS idx_durmah_messages_conversation_id ON public.durmah_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_durmah_messages_user_id ON public.durmah_messages(user_id);

-- Policies

-- 1. View own messages
CREATE POLICY "Users can view own messages"
ON public.durmah_messages FOR SELECT
USING (auth.uid() = user_id);

-- 2. Insert own messages (required for chat)
CREATE POLICY "Users can insert own messages"
ON public.durmah_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 3. Update own messages (required for SAVE functionality)
CREATE POLICY "Users can update own messages"
ON public.durmah_messages FOR UPDATE
USING (auth.uid() = user_id);

-- 4. Delete own messages
CREATE POLICY "Users can delete own messages"
ON public.durmah_messages FOR DELETE
USING (auth.uid() = user_id);
