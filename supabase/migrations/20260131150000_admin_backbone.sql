-- Phase 1: Data Model for Admin Backbone
-- Date: 2026-01-31

-- A) Extend Profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT NULL;

-- B) Admin Audit Log
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_user_id UUID,
  metadata JSONB
);

-- RLS for Audit Log
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs" ON admin_audit_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
  );

-- Only service role or admins via special function should insert, 
-- but for simplicity allow admins to insert if they audit *themselves* (client-side)
-- Better: Use Service Role in API routes. 
-- So we might strictly limit INSERT to service_role mostly, 
-- but allowing 'admin' insert is handy for simple logging.

CREATE POLICY "Admins can insert audit logs" ON admin_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
  );


-- C) Extend Access Requests
-- Existing table has: email, name, cohort, message, expected_term, college, request_status, source, ip_hash
-- Missing: request_type (trial_extension, billing_help, cancellation, demo_request, general_support)

ALTER TABLE access_requests 
ADD COLUMN IF NOT EXISTS request_type TEXT DEFAULT 'access_request';

-- D) Indexes
CREATE INDEX IF NOT EXISTS idx_audit_admin_id ON admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON admin_audit_log(action);
