-- Migration: Create Access Allowlist for Durham Email Gate
-- Purpose: IP protection - only verified Durham students can access app
-- Date: 2026-01-07

-- =====================================================
-- 1. CREATE ACCESS ALLOWLIST TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS access_allowlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'pending')),
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  trial_expires_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT NULL
);

-- Comments
COMMENT ON TABLE access_allowlist IS 'Controls who can access Caseway - Durham students only with trial management';
COMMENT ON COLUMN access_allowlist.email IS 'Lowercase email address (must be @durham.ac.uk)';
COMMENT ON COLUMN access_allowlist.status IS 'active = allowed, blocked = denied, pending = awaiting approval';
COMMENT ON COLUMN access_allowlist.role IS 'student = normal user, admin = can manage allowlist';
COMMENT ON COLUMN access_allowlist.trial_expires_at IS 'NULL = full access (paid/permanent), future date = trial user, past date = expired';

-- =====================================================
-- 2. INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_access_allowlist_email ON access_allowlist (LOWER(email));
CREATE INDEX idx_access_allowlist_status ON access_allowlist (status);
CREATE INDEX idx_access_allowlist_role ON access_allowlist (role);
CREATE INDEX idx_access_allowlist_trial_expires ON access_allowlist (trial_expires_at) WHERE trial_expires_at IS NOT NULL;

-- =====================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE access_allowlist ENABLE ROW LEVEL SECURITY;

-- Policy: Admin-only access
-- Normal users CANNOT read allowlist (prevents scraping)
-- Only service-role or admin users can access
CREATE POLICY "Admin-only access to allowlist"
ON access_allowlist
FOR ALL
USING (
  -- Allow if user is admin in allowlist
  EXISTS (
    SELECT 1 FROM access_allowlist al
    WHERE al.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND al.role = 'admin'
    AND al.status = 'active'
  )
);

-- =====================================================
-- 4. TRIGGER: AUTO-UPDATE updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_access_allowlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_access_allowlist_updated_at
  BEFORE UPDATE ON access_allowlist
  FOR EACH ROW
  EXECUTE FUNCTION update_access_allowlist_updated_at();

-- =====================================================
-- 5. SEED FIRST ADMIN USER
-- =====================================================

-- TODO: Replace with YOUR actual Durham email
-- This creates the first admin who can manage the allowlist
INSERT INTO access_allowlist (email, role, status, trial_expires_at, notes)
VALUES (
  'mohan0265@gmail.com', -- CHANGE THIS to your Durham email or keep for testing
  'admin',
  'active',
  NULL, -- Full access (no trial limit)
  'Initial admin - created by migration'
)
ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  status = 'active',
  trial_expires_at = NULL,
  notes = 'Promoted to admin by migration';

-- Optional: Add your daughter Priya as full-access student for testing
-- Uncomment and modify email:
-- INSERT INTO access_allowlist (email, role, status, trial_expires_at, notes)
-- VALUES (
--   'priya.chandramohan@durham.ac.uk',
--   'student',
--   'active',
--   NULL,
--   'Full access - daughter/primary user'
-- )
-- ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- 6. HELPER FUNCTION: Check Access (Optional)
-- =====================================================

-- This function can be called from RLS policies or server code
-- Returns TRUE if user is allowed, FALSE otherwise
CREATE OR REPLACE FUNCTION is_user_allowed(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM access_allowlist
    WHERE LOWER(email) = LOWER(user_email)
    AND status = 'active'
    AND (
      trial_expires_at IS NULL 
      OR trial_expires_at > NOW()
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_user_allowed IS 'Check if email is in active allowlist with valid trial';

-- =====================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- =====================================================

-- To undo this migration:
-- DROP FUNCTION IF EXISTS is_user_allowed(TEXT);
-- DROP TRIGGER IF EXISTS trigger_access_allowlist_updated_at ON access_allowlist;
-- DROP FUNCTION IF EXISTS update_access_allowlist_updated_at();
-- DROP TABLE IF EXISTS access_allowlist CASCADE;
