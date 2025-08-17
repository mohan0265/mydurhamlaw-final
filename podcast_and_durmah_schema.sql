-- Daily Smart Podcast and Durmah Voice Mode Schema
-- Run this SQL in your Supabase SQL editor

-- 1. PODCASTS TABLE
-- Stores metadata for daily podcast episodes
CREATE TABLE IF NOT EXISTS podcasts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date date NOT NULL,
    slot text NOT NULL CHECK (slot IN ('pre', 'post')),
    title text NOT NULL,
    script text NOT NULL,
    audio_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_podcasts_user_date ON podcasts(user_id, date);
CREATE INDEX IF NOT EXISTS idx_podcasts_user_slot ON podcasts(user_id, slot);
CREATE INDEX IF NOT EXISTS idx_podcasts_created_at ON podcasts(created_at);

-- Add unique constraint to prevent duplicates
ALTER TABLE podcasts ADD CONSTRAINT unique_user_date_slot UNIQUE (user_id, date, slot);

-- 2. DURMAH TRANSCRIPTS TABLE  
-- Stores Durmah voice conversation transcripts
CREATE TABLE IF NOT EXISTS durmah_transcripts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    started_at timestamptz DEFAULT now(),
    ended_at timestamptz,
    turns jsonb NOT NULL DEFAULT '[]'::jsonb,
    title text,
    created_at timestamptz DEFAULT now()
);

-- Add indexes for transcripts
CREATE INDEX IF NOT EXISTS idx_durmah_transcripts_user ON durmah_transcripts(user_id);
CREATE INDEX IF NOT EXISTS idx_durmah_transcripts_date ON durmah_transcripts(started_at);

-- 3. ROW LEVEL SECURITY (RLS)
-- Enable RLS on both tables
ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE durmah_transcripts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for podcasts table
CREATE POLICY "Users can view own podcasts" ON podcasts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own podcasts" ON podcasts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own podcasts" ON podcasts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own podcasts" ON podcasts
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for durmah_transcripts table  
CREATE POLICY "Users can view own transcripts" ON durmah_transcripts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transcripts" ON durmah_transcripts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transcripts" ON durmah_transcripts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transcripts" ON durmah_transcripts
    FOR DELETE USING (auth.uid() = user_id);

-- 4. STORAGE BUCKETS
-- Create podcasts storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('podcasts', 'podcasts', false)
ON CONFLICT (id) DO NOTHING;

-- Create durmah storage bucket (for any audio files)
INSERT INTO storage.buckets (id, name, public)
VALUES ('durmah', 'durmah', false)  
ON CONFLICT (id) DO NOTHING;

-- 5. STORAGE RLS POLICIES
-- Podcasts storage policies
CREATE POLICY "Users can upload own podcast files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'podcasts' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view own podcast files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'podcasts' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own podcast files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'podcasts' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Durmah storage policies
CREATE POLICY "Users can upload own durmah files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'durmah' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view own durmah files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'durmah' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own durmah files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'durmah' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- 6. UTILITY FUNCTIONS
-- Function to get today's podcasts for a user
CREATE OR REPLACE FUNCTION get_today_podcasts(target_user_id uuid)
RETURNS TABLE(
    id uuid,
    slot text,
    title text,
    script text,
    audio_url text,
    created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT p.id, p.slot, p.title, p.script, p.audio_url, p.created_at
    FROM podcasts p
    WHERE p.user_id = target_user_id 
    AND p.date = CURRENT_DATE
    ORDER BY 
        CASE p.slot 
            WHEN 'pre' THEN 1 
            WHEN 'post' THEN 2 
            ELSE 3 
        END;
$$;

-- Function to cleanup old podcast files (run weekly)
CREATE OR REPLACE FUNCTION cleanup_old_podcasts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete podcast records older than 30 days
    DELETE FROM podcasts 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Note: Storage files should be cleaned up via a separate process
    -- as we need to maintain referential integrity
END;
$$;

-- Function to get user's recent transcripts
CREATE OR REPLACE FUNCTION get_recent_transcripts(target_user_id uuid, limit_count int DEFAULT 10)
RETURNS TABLE(
    id uuid,
    title text,
    started_at timestamptz,
    ended_at timestamptz,
    turn_count int
)
LANGUAGE sql
SECURITY DEFINER  
AS $$
    SELECT 
        dt.id,
        COALESCE(dt.title, 'Untitled Conversation') as title,
        dt.started_at,
        dt.ended_at,
        jsonb_array_length(dt.turns) as turn_count
    FROM durmah_transcripts dt
    WHERE dt.user_id = target_user_id
    ORDER BY dt.started_at DESC
    LIMIT limit_count;
$$;

-- 7. TRIGGERS for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to podcasts table
CREATE TRIGGER update_podcasts_updated_at 
    BEFORE UPDATE ON podcasts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE podcasts TO authenticated;
GRANT ALL ON TABLE durmah_transcripts TO authenticated;
GRANT EXECUTE ON FUNCTION get_today_podcasts(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_transcripts(uuid, int) TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE podcasts IS 'Stores daily AI-generated podcast episodes for students';
COMMENT ON TABLE durmah_transcripts IS 'Stores Durmah voice conversation transcripts';
COMMENT ON COLUMN podcasts.slot IS 'Either ''pre'' for morning or ''post'' for evening podcast';
COMMENT ON COLUMN podcasts.script IS 'Generated text content for the podcast episode';
COMMENT ON COLUMN podcasts.audio_url IS 'URL to the generated MP3 file in Supabase storage';
COMMENT ON COLUMN durmah_transcripts.turns IS 'JSON array of conversation turns with user and AI messages';

-- Success message
SELECT 'Daily Smart Podcast and Durmah Voice Mode schema created successfully!' as status;