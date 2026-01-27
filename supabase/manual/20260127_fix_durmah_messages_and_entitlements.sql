-- Manual SQL Fix: durmah_messages Types & Entitlements Provisioning (v2)
-- Date: 2026-01-27
-- Description: Fixes type mismatch in durmah_messages and ensures current users have DURHAM access with corrected 'TRIAL' tier.

BEGIN;

-- 1. FIX durmah_messages TYPES
-- Ensures user_id and conversation_id are UUIDs (standard for all new features)
DO $$ 
BEGIN 
    -- user_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'durmah_messages' AND column_name = 'user_id' AND data_type = 'text'
    ) THEN
        ALTER TABLE public.durmah_messages ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
    END IF;

    -- conversation_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'durmah_messages' AND column_name = 'conversation_id' AND data_type = 'text'
    ) THEN
        ALTER TABLE public.durmah_messages ALTER COLUMN conversation_id TYPE uuid USING conversation_id::uuid;
    END IF;
END $$;

-- 2. FIX RLS POLICIES (Make them type-safe)
DROP POLICY IF EXISTS "Users can view own messages" ON public.durmah_messages;
CREATE POLICY "Users can view own messages" ON public.durmah_messages
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own messages" ON public.durmah_messages;
CREATE POLICY "Users can insert own messages" ON public.durmah_messages
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. PROVISION ENTITLEMENTS (Trial Access)
-- Fixed: Added 'tier' as 'TRIAL' to satisfy NOT NULL constraint
INSERT INTO public.user_entitlements (user_id, product, tier, status, created_at, features)
SELECT id, 'DURHAM', 'TRIAL', 'ACTIVE', now(), '{"voice_enabled": true}'::jsonb
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_entitlements WHERE product = 'DURHAM')
ON CONFLICT DO NOTHING;

-- 4. ENSURE Profiles have appropriate year group if missing
UPDATE public.profiles
SET year_group = 'year1'
WHERE year_group IS NULL;

COMMIT;
