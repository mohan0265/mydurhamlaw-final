-- Premier Lounge Migration SQL
-- Tables, RLS, Storage, RPCs, and Views

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add is_banned to profiles if missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false;

-- Create tables
CREATE TABLE lounge_posts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    body text CHECK (length(body) <= 3000),
    image_url text,
    audio_url text,
    created_at timestamptz DEFAULT now() NOT NULL,
    is_hidden boolean DEFAULT false,
    is_shadow_muted boolean DEFAULT false,
    automod_flag boolean DEFAULT false
);

CREATE TABLE lounge_sparks (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    text text CHECK (length(text) <= 140) NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    is_hidden boolean DEFAULT false,
    is_shadow_muted boolean DEFAULT false,
    automod_flag boolean DEFAULT false
);

CREATE TABLE lounge_reactions (
    post_id uuid REFERENCES lounge_posts(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    emoji text CHECK (length(emoji) <= 8) NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    PRIMARY KEY (post_id, user_id, emoji)
);

CREATE TABLE lounge_reports (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_type text CHECK (target_type IN ('post', 'spark')) NOT NULL,
    target_id uuid NOT NULL,
    reporter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    reason text CHECK (length(reason) <= 500),
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE lounge_blocks (
    blocker_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    blocked_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    PRIMARY KEY (blocker_id, blocked_id),
    CHECK (blocker_id != blocked_id)
);

CREATE TABLE lounge_user_settings (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    accepted_rules_at timestamptz,
    last_seen_at timestamptz DEFAULT now(),
    rate_window_started_at timestamptz,
    posts_in_window int DEFAULT 0,
    sparks_in_window int DEFAULT 0
);

CREATE TABLE moderation_actions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_type text NOT NULL,
    target_id uuid NOT NULL,
    action text CHECK (action IN ('hide', 'ban_user', 'unban_user', 'shadow_mute', 'unshadow_mute')) NOT NULL,
    actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    reason text,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE automod_incidents (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_type text NOT NULL,
    target_id uuid NOT NULL,
    author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    matched_rule text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_lounge_posts_created_at ON lounge_posts(created_at DESC);
CREATE INDEX idx_lounge_posts_author_id ON lounge_posts(author_id);
CREATE INDEX idx_lounge_sparks_created_at ON lounge_sparks(created_at DESC);
CREATE INDEX idx_lounge_sparks_author_id ON lounge_sparks(author_id);
CREATE INDEX idx_lounge_blocks_blocker ON lounge_blocks(blocker_id);
CREATE INDEX idx_lounge_blocks_blocked ON lounge_blocks(blocked_id);
CREATE INDEX idx_lounge_reactions_post ON lounge_reactions(post_id);

-- Create public views
CREATE VIEW lounge_posts_public AS
SELECT 
    lp.id,
    lp.author_id,
    lp.body,
    lp.image_url,
    lp.audio_url,
    lp.created_at,
    p.display_name as author_display_name
FROM lounge_posts lp
JOIN profiles p ON lp.author_id = p.id
WHERE lp.is_hidden = false
AND NOT EXISTS (
    SELECT 1 FROM lounge_blocks lb 
    WHERE (lb.blocker_id = auth.uid() AND lb.blocked_id = lp.author_id)
    OR (lb.blocked_id = auth.uid() AND lb.blocker_id = lp.author_id)
);

CREATE VIEW lounge_sparks_public AS
SELECT 
    ls.id,
    ls.author_id,
    ls.text,
    ls.created_at,
    p.display_name as author_display_name
FROM lounge_sparks ls
JOIN profiles p ON ls.author_id = p.id
WHERE ls.is_hidden = false
AND NOT EXISTS (
    SELECT 1 FROM lounge_blocks lb 
    WHERE (lb.blocker_id = auth.uid() AND lb.blocked_id = ls.author_id)
    OR (lb.blocked_id = auth.uid() AND lb.blocker_id = ls.author_id)
);

-- Enable RLS
ALTER TABLE lounge_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lounge_sparks ENABLE ROW LEVEL SECURITY;
ALTER TABLE lounge_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lounge_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE lounge_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE lounge_user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automod_incidents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lounge_posts
CREATE POLICY "Posts viewable by all authenticated users" ON lounge_posts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own posts" ON lounge_posts
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts" ON lounge_posts
    FOR UPDATE USING (auth.uid() = author_id OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can delete their own posts" ON lounge_posts
    FOR DELETE USING (auth.uid() = author_id OR auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for lounge_sparks
CREATE POLICY "Sparks viewable by all authenticated users" ON lounge_sparks
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own sparks" ON lounge_sparks
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own sparks" ON lounge_sparks
    FOR UPDATE USING (auth.uid() = author_id OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can delete their own sparks" ON lounge_sparks
    FOR DELETE USING (auth.uid() = author_id OR auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for lounge_reactions
CREATE POLICY "Reactions viewable by all authenticated users" ON lounge_reactions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own reactions" ON lounge_reactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions" ON lounge_reactions
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for lounge_reports
CREATE POLICY "Users can insert reports" ON lounge_reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Service role can view reports" ON lounge_reports
    FOR SELECT USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for lounge_blocks
CREATE POLICY "Users can manage their blocks" ON lounge_blocks
    FOR ALL USING (auth.uid() = blocker_id);

-- RLS Policies for lounge_user_settings
CREATE POLICY "Users can manage their own settings" ON lounge_user_settings
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for moderation_actions
CREATE POLICY "Service role can manage moderation actions" ON moderation_actions
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for automod_incidents
CREATE POLICY "Service role can view automod incidents" ON automod_incidents
    FOR SELECT USING (auth.jwt() ->> 'role' = 'service_role');

-- Enable realtime
ALTER publication supabase_realtime ADD TABLE lounge_posts;
ALTER publication supabase_realtime ADD TABLE lounge_sparks;
ALTER publication supabase_realtime ADD TABLE lounge_reactions;

-- Storage bucket (note: may need manual creation in Supabase dashboard)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('lounge_uploads', 'lounge_uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public read access" ON storage.objects
    FOR SELECT USING (bucket_id = 'lounge_uploads');

CREATE POLICY "Authenticated users can upload to their own path" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'lounge_uploads' AND 
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- RPC Functions
CREATE OR REPLACE FUNCTION accept_lounge_rules()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    INSERT INTO lounge_user_settings (user_id, accepted_rules_at)
    VALUES (auth.uid(), now())
    ON CONFLICT (user_id) DO UPDATE SET accepted_rules_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION block_user(p_blocked_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    INSERT INTO lounge_blocks (blocker_id, blocked_id)
    VALUES (auth.uid(), p_blocked_id)
    ON CONFLICT DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION unblock_user(p_blocked_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    DELETE FROM lounge_blocks 
    WHERE blocker_id = auth.uid() AND blocked_id = p_blocked_id;
END;
$$;

CREATE OR REPLACE FUNCTION automod_scan_text(p_text text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    bad_words text[] := ARRAY['spam', 'scam', 'hate', 'abuse', 'harass', 'threat'];
    word text;
BEGIN
    p_text := lower(p_text);
    
    FOREACH word IN ARRAY bad_words
    LOOP
        IF p_text LIKE '%' || word || '%' THEN
            RETURN word;
        END IF;
    END LOOP;
    
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION create_lounge_post(p_body text, p_image_url text DEFAULT NULL, p_audio_url text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_settings record;
    v_automod_flag text;
    v_post_id uuid;
    v_is_banned boolean;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Check if user is banned
    SELECT is_banned INTO v_is_banned FROM profiles WHERE id = v_user_id;
    IF v_is_banned THEN
        RAISE EXCEPTION 'User is banned';
    END IF;

    -- Get or create user settings
    INSERT INTO lounge_user_settings (user_id) VALUES (v_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    SELECT * INTO v_settings FROM lounge_user_settings WHERE user_id = v_user_id;

    -- Check if rules accepted
    IF v_settings.accepted_rules_at IS NULL THEN
        RAISE EXCEPTION 'Must accept rules first';
    END IF;

    -- Rate limiting
    IF v_settings.rate_window_started_at IS NULL OR 
       v_settings.rate_window_started_at < now() - INTERVAL '1 hour' THEN
        UPDATE lounge_user_settings 
        SET rate_window_started_at = now(), posts_in_window = 0 
        WHERE user_id = v_user_id;
        v_settings.posts_in_window := 0;
    END IF;

    IF v_settings.posts_in_window >= 6 THEN
        RAISE EXCEPTION 'Rate limit exceeded: 6 posts per hour';
    END IF;

    -- Check daily limit (simplified)
    IF (SELECT COUNT(*) FROM lounge_posts 
        WHERE author_id = v_user_id AND created_at > now() - INTERVAL '1 day') >= 40 THEN
        RAISE EXCEPTION 'Rate limit exceeded: 40 posts per day';
    END IF;

    -- Automod scan
    v_automod_flag := automod_scan_text(p_body);

    -- Create post
    INSERT INTO lounge_posts (author_id, body, image_url, audio_url, automod_flag, is_shadow_muted)
    VALUES (v_user_id, p_body, p_image_url, p_audio_url, v_automod_flag IS NOT NULL, v_automod_flag IS NOT NULL)
    RETURNING id INTO v_post_id;

    -- Log automod incident if flagged
    IF v_automod_flag IS NOT NULL THEN
        INSERT INTO automod_incidents (target_type, target_id, author_id, matched_rule)
        VALUES ('post', v_post_id, v_user_id, v_automod_flag);
    END IF;

    -- Update rate limit counter
    UPDATE lounge_user_settings 
    SET posts_in_window = posts_in_window + 1 
    WHERE user_id = v_user_id;

    RETURN v_post_id;
END;
$$;

CREATE OR REPLACE FUNCTION create_lounge_spark(p_text text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_settings record;
    v_automod_flag text;
    v_spark_id uuid;
    v_is_banned boolean;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Check if user is banned
    SELECT is_banned INTO v_is_banned FROM profiles WHERE id = v_user_id;
    IF v_is_banned THEN
        RAISE EXCEPTION 'User is banned';
    END IF;

    -- Get or create user settings
    INSERT INTO lounge_user_settings (user_id) VALUES (v_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    SELECT * INTO v_settings FROM lounge_user_settings WHERE user_id = v_user_id;

    -- Check if rules accepted
    IF v_settings.accepted_rules_at IS NULL THEN
        RAISE EXCEPTION 'Must accept rules first';
    END IF;

    -- Rate limiting
    IF v_settings.rate_window_started_at IS NULL OR 
       v_settings.rate_window_started_at < now() - INTERVAL '1 hour' THEN
        UPDATE lounge_user_settings 
        SET rate_window_started_at = now(), sparks_in_window = 0 
        WHERE user_id = v_user_id;
        v_settings.sparks_in_window := 0;
    END IF;

    IF v_settings.sparks_in_window >= 10 THEN
        RAISE EXCEPTION 'Rate limit exceeded: 10 sparks per hour';
    END IF;

    -- Check daily limit
    IF (SELECT COUNT(*) FROM lounge_sparks 
        WHERE author_id = v_user_id AND created_at > now() - INTERVAL '1 day') >= 80 THEN
        RAISE EXCEPTION 'Rate limit exceeded: 80 sparks per day';
    END IF;

    -- Automod scan
    v_automod_flag := automod_scan_text(p_text);

    -- Create spark
    INSERT INTO lounge_sparks (author_id, text, automod_flag, is_shadow_muted)
    VALUES (v_user_id, p_text, v_automod_flag IS NOT NULL, v_automod_flag IS NOT NULL)
    RETURNING id INTO v_spark_id;

    -- Log automod incident if flagged
    IF v_automod_flag IS NOT NULL THEN
        INSERT INTO automod_incidents (target_type, target_id, author_id, matched_rule)
        VALUES ('spark', v_spark_id, v_user_id, v_automod_flag);
    END IF;

    -- Update rate limit counter
    UPDATE lounge_user_settings 
    SET sparks_in_window = sparks_in_window + 1 
    WHERE user_id = v_user_id;

    RETURN v_spark_id;
END;
$$;

CREATE OR REPLACE FUNCTION hide_lounge_post(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    UPDATE lounge_posts 
    SET is_hidden = true 
    WHERE id = p_id AND author_id = auth.uid();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Post not found or access denied';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION hide_lounge_spark(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    UPDATE lounge_sparks 
    SET is_hidden = true 
    WHERE id = p_id AND author_id = auth.uid();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Spark not found or access denied';
    END IF;
END;
$$;

-- Admin functions (service role only)
CREATE OR REPLACE FUNCTION admin_ban_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF auth.jwt() ->> 'role' != 'service_role' THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    UPDATE profiles SET is_banned = true WHERE id = p_user_id;
    
    INSERT INTO moderation_actions (target_type, target_id, action, actor_id)
    VALUES ('user', p_user_id, 'ban_user', auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION admin_unban_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF auth.jwt() ->> 'role' != 'service_role' THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    UPDATE profiles SET is_banned = false WHERE id = p_user_id;
    
    INSERT INTO moderation_actions (target_type, target_id, action, actor_id)
    VALUES ('user', p_user_id, 'unban_user', auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION shadow_mute_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF auth.jwt() ->> 'role' != 'service_role' THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    UPDATE lounge_posts SET is_shadow_muted = true WHERE author_id = p_user_id;
    UPDATE lounge_sparks SET is_shadow_muted = true WHERE author_id = p_user_id;
    
    INSERT INTO moderation_actions (target_type, target_id, action, actor_id)
    VALUES ('user', p_user_id, 'shadow_mute', auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION unshadow_mute_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF auth.jwt() ->> 'role' != 'service_role' THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    UPDATE lounge_posts SET is_shadow_muted = false WHERE author_id = p_user_id;
    UPDATE lounge_sparks SET is_shadow_muted = false WHERE author_id = p_user_id;
    
    INSERT INTO moderation_actions (target_type, target_id, action, actor_id)
    VALUES ('user', p_user_id, 'unshadow_mute', auth.uid());
END;
$$;

-- Pagination functions
CREATE OR REPLACE FUNCTION get_lounge_posts_page(p_limit int DEFAULT 20, p_cursor timestamptz DEFAULT NULL)
RETURNS TABLE (
    id uuid,
    author_id uuid,
    body text,
    image_url text,
    audio_url text,
    created_at timestamptz,
    author_display_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    RETURN QUERY
    SELECT * FROM lounge_posts_public
    WHERE (p_cursor IS NULL OR created_at < p_cursor)
    ORDER BY created_at DESC
    LIMIT p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION get_lounge_sparks_recent(p_limit int DEFAULT 50)
RETURNS TABLE (
    id uuid,
    author_id uuid,
    text text,
    created_at timestamptz,
    author_display_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    RETURN QUERY
    SELECT * FROM lounge_sparks_public
    ORDER BY created_at DESC
    LIMIT p_limit;
END;
$$;