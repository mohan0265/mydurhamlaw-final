-- 20251218154500_awy_access_hardening.sql
-- Harden AWY access with Audit Log and Status Tracking

-- 1. Update awy_connections table
ALTER TABLE public.awy_connections
ADD COLUMN IF NOT EXISTS granted_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
ADD COLUMN IF NOT EXISTS granted_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS revoked_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS last_seen_at timestamptz,
ADD COLUMN IF NOT EXISTS note text;

-- Update status check constraint to include 'granted' and 'revoked' if not present
-- First, drop the old constraint if it exists (names might vary, so we try standardized names)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'awy_connections_status_check') THEN
        ALTER TABLE public.awy_connections DROP CONSTRAINT awy_connections_status_check;
    END IF;
END $$;

-- Add new constraint
ALTER TABLE public.awy_connections
ADD CONSTRAINT awy_connections_status_check 
CHECK (status IN ('pending', 'invited', 'active', 'granted', 'accepted', 'blocked', 'revoked'));

-- 2. Create Audit Log Table
CREATE TABLE IF NOT EXISTS public.awy_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id uuid NOT NULL REFERENCES public.awy_connections(id) ON DELETE CASCADE,
    action text NOT NULL, -- 'grant', 'revoke', 'login', 'view_dashboard'
    actor_user_id uuid REFERENCES auth.users(id), -- Can be student or loved one
    actor_role text NOT NULL, -- 'student', 'loved_one', 'system'
    details jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_awy_audit_connection_created ON public.awy_audit_log(connection_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_awy_audit_actor_created ON public.awy_audit_log(actor_user_id, created_at DESC);

-- 3. RLS for Audit Log
ALTER TABLE public.awy_audit_log ENABLE ROW LEVEL SECURITY;

-- Student can select audit logs for their connections
CREATE POLICY "Student can view audit logs for own connections"
ON public.awy_audit_log FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.awy_connections c
        WHERE c.id = public.awy_audit_log.connection_id
        AND c.student_id = auth.uid()
    )
);

-- Loved One can select audit logs for their specific connection
CREATE POLICY "Loved one can view their own audit logs"
ON public.awy_audit_log FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.awy_connections c
        WHERE c.id = public.awy_audit_log.connection_id
        AND c.loved_one_id = auth.uid()
    )
);

-- Service role (API) can do anything, no policy needed for INSERT if strictly using service role or trusted functions.
-- But if we want to allow INSERT from authenticated users via standard client (rare but possible), we'd need a policy.
-- For now, we assume INSERTs happen via robust API/Functions with service role or explicit definition.
