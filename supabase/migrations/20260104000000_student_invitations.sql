-- Student Invitations System
-- Creates invite-based onboarding with Google OAuth

-- Invitations table
CREATE TABLE IF NOT EXISTS student_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  year_group TEXT NOT NULL CHECK (year_group IN ('foundation', 'year1', 'year2', 'year3')),
  invited_by TEXT, -- admin email or identifier
  invite_token TEXT NOT NULL UNIQUE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'expired')) DEFAULT 'pending',
  trial_days INT DEFAULT 14,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  accepted_at TIMESTAMPTZ,
  user_id UUID REFERENCES auth.users(id), -- Set when invite is accepted
  UNIQUE(email, status) -- Prevent multiple pending invites for same email
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_invite_token ON student_invitations(invite_token);
CREATE INDEX IF NOT EXISTS idx_invite_email ON student_invitations(email);
CREATE INDEX IF NOT EXISTS idx_invite_status ON student_invitations(status);

-- Function to auto-expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE student_invitations
  SET status = 'expired'
  WHERE status = 'pending' 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE student_invitations IS 'Stores student invitation links for trial onboarding';
COMMENT ON COLUMN student_invitations.invite_token IS 'Unique token embedded in invite URL';
COMMENT ON COLUMN student_invitations.trial_days IS 'Number of trial days to grant when accepted';
