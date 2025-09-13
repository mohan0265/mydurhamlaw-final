-- Lounge Tables and RLS Policies for MyDurhamLaw
-- Created: September 3, 2025
-- Purpose: Enable real-time public chat and private DM functionality in the student lounge

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================
-- LOUNGE MESSAGES TABLE (Public Chat)
-- ===================================
CREATE TABLE IF NOT EXISTS lounge_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'emoji', 'system')),
  reply_to_id UUID REFERENCES lounge_messages(id) ON DELETE SET NULL,
  reactions JSONB DEFAULT '{}',
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_lounge_messages_user_id ON lounge_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_lounge_messages_created_at ON lounge_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lounge_messages_reply_to ON lounge_messages(reply_to_id);

-- ===================================
-- LOUNGE DM MESSAGES TABLE (Private Messages)
-- ===================================
CREATE TABLE IF NOT EXISTS lounge_dm_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'emoji', 'file')),
  read_at TIMESTAMP WITH TIME ZONE,
  reply_to_id UUID REFERENCES lounge_dm_messages(id) ON DELETE SET NULL,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure users can't DM themselves
  CONSTRAINT check_different_users CHECK (sender_id != recipient_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_dm_messages_sender_id ON lounge_dm_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_dm_messages_recipient_id ON lounge_dm_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_dm_messages_created_at ON lounge_dm_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_messages_conversation ON lounge_dm_messages(LEAST(sender_id, recipient_id), GREATEST(sender_id, recipient_id), created_at DESC);

-- ===================================
-- USER PRESENCE TABLE (Online Status)
-- ===================================
CREATE TABLE IF NOT EXISTS lounge_user_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_user_presence_status ON lounge_user_presence(status, last_seen DESC);

-- ===================================
-- RLS POLICIES
-- ===================================

-- Enable RLS on all tables
ALTER TABLE lounge_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE lounge_dm_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE lounge_user_presence ENABLE ROW LEVEL SECURITY;

-- Lounge Messages Policies (Public Chat - everyone can read, authenticated users can write)
CREATE POLICY "Anyone can read lounge messages" ON lounge_messages
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert lounge messages" ON lounge_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lounge messages" ON lounge_messages
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lounge messages" ON lounge_messages
  FOR DELETE USING (auth.uid() = user_id);

-- DM Messages Policies (Private - only sender and recipient can access)
CREATE POLICY "Users can read their own DMs" ON lounge_dm_messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Authenticated users can send DMs" ON lounge_dm_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Senders can update their own DMs" ON lounge_dm_messages
  FOR UPDATE USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Senders can delete their own DMs" ON lounge_dm_messages
  FOR DELETE USING (auth.uid() = sender_id);

-- User Presence Policies
CREATE POLICY "Anyone can read user presence" ON lounge_user_presence
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own presence" ON lounge_user_presence
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own presence status" ON lounge_user_presence
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===================================
-- FUNCTIONS AND TRIGGERS
-- ===================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_lounge_messages_updated_at
  BEFORE UPDATE ON lounge_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dm_messages_updated_at
  BEFORE UPDATE ON lounge_dm_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_presence_updated_at
  BEFORE UPDATE ON lounge_user_presence
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update user presence on message send
CREATE OR REPLACE FUNCTION update_user_presence_on_message()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO lounge_user_presence (user_id, status, last_seen)
  VALUES (NEW.user_id, 'online', NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    status = 'online',
    last_seen = NOW(),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to update presence on message activity
CREATE TRIGGER update_presence_on_lounge_message
  AFTER INSERT ON lounge_messages
  FOR EACH ROW EXECUTE FUNCTION update_user_presence_on_message();

-- For DMs, update presence for sender
CREATE OR REPLACE FUNCTION update_sender_presence_on_dm()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO lounge_user_presence (user_id, status, last_seen)
  VALUES (NEW.sender_id, 'online', NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    status = 'online',
    last_seen = NOW(),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_presence_on_dm_message
  AFTER INSERT ON lounge_dm_messages
  FOR EACH ROW EXECUTE FUNCTION update_sender_presence_on_dm();

-- ===================================
-- VIEWS FOR COMMON QUERIES
-- ===================================

-- View for recent lounge messages with user info
CREATE OR REPLACE VIEW recent_lounge_messages AS
SELECT 
  lm.id,
  lm.user_id,
  lm.content,
  lm.message_type,
  lm.reply_to_id,
  lm.reactions,
  lm.edited_at,
  lm.created_at,
  lm.updated_at
FROM lounge_messages lm
ORDER BY lm.created_at DESC
LIMIT 100;

-- View for online users count
CREATE OR REPLACE VIEW online_users_count AS
SELECT 
  COUNT(*) as online_count
FROM lounge_user_presence
WHERE status = 'online' 
  AND last_seen > NOW() - INTERVAL '5 minutes';

-- ===================================
-- GRANTS AND PERMISSIONS
-- ===================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON lounge_messages TO authenticated;
GRANT ALL ON lounge_dm_messages TO authenticated;
GRANT ALL ON lounge_user_presence TO authenticated;
GRANT SELECT ON recent_lounge_messages TO authenticated;
GRANT SELECT ON online_users_count TO authenticated;

-- Grant permissions to anon users for reading public messages
GRANT SELECT ON lounge_messages TO anon;
GRANT SELECT ON recent_lounge_messages TO anon;
GRANT SELECT ON online_users_count TO anon;

-- ===================================
-- INITIAL DATA
-- ===================================

-- Insert a welcome message (system message)
INSERT INTO lounge_messages (user_id, content, message_type) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  'Welcome to the MyDurhamLaw Student Lounge! 🎓 Connect with fellow law students, share resources, and build your legal community.',
  'system'
WHERE NOT EXISTS (
  SELECT 1 FROM lounge_messages WHERE message_type = 'system' AND content LIKE '%Welcome to the MyDurhamLaw%'
);

-- ===================================
-- REAL-TIME SUBSCRIPTIONS
-- ===================================

-- Enable real-time for all lounge tables
ALTER PUBLICATION supabase_realtime ADD TABLE lounge_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE lounge_dm_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE lounge_user_presence;

-- Create notification functions for real-time updates
CREATE OR REPLACE FUNCTION notify_lounge_message()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('lounge_message', row_to_json(NEW)::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lounge_message_notify
  AFTER INSERT ON lounge_messages
  FOR EACH ROW EXECUTE FUNCTION notify_lounge_message();

CREATE OR REPLACE FUNCTION notify_dm_message()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('dm_message', row_to_json(NEW)::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dm_message_notify
  AFTER INSERT ON lounge_dm_messages
  FOR EACH ROW EXECUTE FUNCTION notify_dm_message();

-- ===================================
-- COMMENT DOCUMENTATION
-- ===================================

COMMENT ON TABLE lounge_messages IS 'Public chat messages in the student lounge';
COMMENT ON TABLE lounge_dm_messages IS 'Private direct messages between students';
COMMENT ON TABLE lounge_user_presence IS 'User online status and presence tracking';

COMMENT ON COLUMN lounge_messages.reactions IS 'JSON object storing emoji reactions: {"👍": ["user_id1", "user_id2"], "❤️": ["user_id3"]}';
COMMENT ON COLUMN lounge_dm_messages.read_at IS 'Timestamp when recipient read the message';
COMMENT ON COLUMN lounge_user_presence.last_seen IS 'Last activity timestamp for presence tracking';

-- End of lounge.sql schema
