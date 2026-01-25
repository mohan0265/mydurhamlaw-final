-- Migration: LNAT Entitlements & Second Door
-- Date: 2026-01-26
-- Description: Introduces user_entitlements table to manage DURHAM vs LNAT access separately.

BEGIN;

-- 1. Create Entitlements Table
CREATE TABLE IF NOT EXISTS public.user_entitlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product TEXT NOT NULL CHECK (product IN ('DURHAM', 'LNAT')),
    tier TEXT NOT NULL CHECK (tier IN ('TRIAL', 'PAID')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'CANCELLED')),
    expires_at TIMESTAMPTZ,
    features JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure a user can only have one entitlement entry per product type
    UNIQUE(user_id, product)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_entitlements_user_id ON public.user_entitlements(user_id);

-- 3. RLS Policies
ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;

-- Users can read their own entitlements
CREATE POLICY "Users can read own entitlements" ON public.user_entitlements
    FOR SELECT USING (auth.uid() = user_id);

-- Only Service Role or specific secure functions can insert/update (No direct user write)
-- Note: 'postgres' and 'service_role' bypass RLS by default, so we don't strictly need a policy for them if no other policies restrict them ambiguously,
-- but adding an explicit denial for anon/authenticated writes is good practice implicitly by NOT adding a USING/WITH CHECK policy for them.
-- So we just leave it as Read-Only for authenticated users.

-- 4. Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_entitlements_modtime ON public.user_entitlements;
CREATE TRIGGER update_user_entitlements_modtime
    BEFORE UPDATE ON public.user_entitlements
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

COMMIT;
