-- Add role and security columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'trial', 'paid', 'demo', 'admin')),
ADD COLUMN IF NOT EXISTS password_locked boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS demo_expires_at timestamptz NULL,
ADD COLUMN IF NOT EXISTS is_disabled boolean NOT NULL DEFAULT false;

-- Enhance RLS to prevent unauthorized updates to these sensitive columns
-- Note: Existing policies typically allow users to update their own profile.
-- We'll add a specific check to ensure users cannot escalate their own role.

CREATE OR REPLACE FUNCTION public.check_profile_update_security()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent changing role
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Cannot change own role';
  END IF;

  -- Prevent changing password_locked
  IF NEW.password_locked IS DISTINCT FROM OLD.password_locked THEN
    RAISE EXCEPTION 'Cannot change password_locked status';
  END IF;
  
  -- Prevent changing demo_expires_at
  IF NEW.demo_expires_at IS DISTINCT FROM OLD.demo_expires_at THEN
    RAISE EXCEPTION 'Cannot change demo expiration';
  END IF;
  
  -- Prevent changing is_disabled
  IF NEW.is_disabled IS DISTINCT FROM OLD.is_disabled THEN
    RAISE EXCEPTION 'Cannot change disabled status';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger checks only for non-admin/service_role updates would be ideal, 
-- but RLS is the primary guard. Ideally, we just assume the API doesn't send these fields, 
-- but a trigger provides DB-level safety. Only apply to 'authenticated' users.

DROP TRIGGER IF EXISTS protect_profile_sensitive_fields ON profiles;
CREATE TRIGGER protect_profile_sensitive_fields
BEFORE UPDATE ON profiles
FOR EACH ROW
WHEN (auth.role() = 'authenticated')
EXECUTE FUNCTION public.check_profile_update_security();
