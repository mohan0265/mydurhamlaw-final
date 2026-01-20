-- Migration: Restrict Signups to Durham Emails or Invited Users
-- Date: 2026-01-20
-- Purpose: Prevent public signups from non-Durham addresses, while allowing Admin-invited guests (e.g. Gmail test accounts).

CREATE OR REPLACE FUNCTION public.check_signup_domain()
RETURNS TRIGGER AS $$
DECLARE
  is_durham BOOLEAN;
  is_invited BOOLEAN;
  is_allowed_list BOOLEAN;
BEGIN
  -- 1. Check Domain
  is_durham := (LOWER(NEW.email) LIKE '%@durham.ac.uk');
  
  IF is_durham THEN
    RETURN NEW;
  END IF;

  -- 2. Check Student Invitations (Admin Invites)
  -- Check if there is a pending invite for this email
  SELECT EXISTS (
    SELECT 1 FROM public.student_invitations 
    WHERE LOWER(email) = LOWER(NEW.email)
  ) INTO is_invited;

  IF is_invited THEN
    RETURN NEW;
  END IF;

  -- 3. Check Access Allowlist (Manual Overrides)
  -- Check if explicitly allowed via access_allowlist table
  IF to_regclass('public.access_allowlist') IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.access_allowlist 
      WHERE LOWER(email) = LOWER(NEW.email) 
      AND status = 'active'
    ) INTO is_allowed_list;
    
    IF is_allowed_list THEN
      RETURN NEW;
    END IF;
  END IF;

  -- 4. Check Loved One Invites (via awy_connections)
  -- Loved ones might sign up with Gmail. We should verify they were invited by a student.
  -- They typically have a 'pending' or 'invited' status in awy_connections.
  IF to_regclass('public.awy_connections') IS NOT NULL THEN
     -- Check if this email is listed as a loved_email in connections
     SELECT EXISTS (
       SELECT 1 FROM public.awy_connections
       WHERE LOWER(loved_email) = LOWER(NEW.email)
     ) INTO is_invited;

     IF is_invited THEN
       RETURN NEW;
     END IF;
  END IF;

  -- 5. REJECT if none of the above
  RAISE EXCEPTION 'Registration restricted to Durham University students (@durham.ac.uk) or invited guests.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Trigger
DROP TRIGGER IF EXISTS trg_check_signup_domain ON auth.users;

CREATE TRIGGER trg_check_signup_domain
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.check_signup_domain();
