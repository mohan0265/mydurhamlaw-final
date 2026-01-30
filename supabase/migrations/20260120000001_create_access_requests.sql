-- Migration: Create Access Requests Table
-- Date: 2026-01-20
-- Purpose: Allow non-Durham students to request access, with Admin approval flow.

CREATE TABLE IF NOT EXISTS public.access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  cohort TEXT NOT NULL CHECK (cohort IN ('foundation', 'year1', 'year2', 'year3', 'alumni', 'other')),
  message TEXT,
  expected_term TEXT, -- Optional: 'Michaelmas', 'Epiphany', etc.
  college TEXT,       -- Optional: 'University College', etc.
  request_status TEXT NOT NULL DEFAULT 'pending' CHECK (request_status IN ('pending', 'approved', 'rejected')),
  source TEXT NOT NULL DEFAULT 'web',
  ip_hash TEXT,       -- Hashed IP for rate limiting/auditing
  decision_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE access_requests IS 'Inbound requests for access from non-Durham or pre-enrolled students.';

-- Indexes
CREATE INDEX idx_access_requests_status ON access_requests(request_status);
CREATE INDEX idx_access_requests_created_at ON access_requests(created_at);

-- Uniqueness: Only one PENDING request per email
CREATE UNIQUE INDEX idx_access_requests_email_pending ON access_requests(LOWER(email)) WHERE request_status = 'pending';

-- RLS
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Public can INSERT only (submit request)
-- NOTE: We use a Supabase function/RPC or API route usually, but for direct insert via client:
-- Ideally, we block direct SELECT.
CREATE POLICY "Public can insert requests" ON access_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Policy: Admin can do ALL
CREATE POLICY "Admin full access" ON access_requests
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM access_allowlist 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()) 
      AND role = 'admin' 
      AND status = 'active'
    )
  );

-- Trigger for updated_at
CREATE TRIGGER trg_access_requests_updated
  BEFORE UPDATE ON access_requests
  FOR EACH ROW EXECUTE FUNCTION update_access_allowlist_updated_at(); -- Reusing existing function
