-- ==============================================================================
-- AWY FULL SYSTEM MIGRATION
-- ==============================================================================
-- This migration ensures all necessary tables and policies exist for the full AWY system.
-- It is idempotent (uses IF NOT EXISTS).

-- 1. PROFILES & ROLES
-- Ensure profiles table has a role column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role text DEFAULT 'student';
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('student', 'loved_one', 'admin'));
    END IF;
END $$;

-- 2. AWY CONNECTIONS
-- Links students to loved ones
CREATE TABLE IF NOT EXISTS public.awy_connections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    loved_one_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- Can be null if pending invite
    loved_email text NOT NULL,
    relationship text NOT NULL, -- 'Mum', 'Dad', etc.
    nickname text,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'blocked')),
    is_visible boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (student_id, loved_email)
);

ALTER TABLE public.awy_connections ENABLE ROW LEVEL SECURITY;

-- RLS: Students can manage their own connections
CREATE POLICY "Students can manage their connections" 
    ON public.awy_connections 
    FOR ALL 
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);

-- RLS: Loved ones can view connections where they are the loved_one_id
CREATE POLICY "Loved ones can view their connections" 
    ON public.awy_connections 
    FOR SELECT 
    USING (auth.uid() = loved_one_id);

-- 3. AWY PRESENCE
-- Stores online status and visibility preference
CREATE TABLE IF NOT EXISTS public.awy_presence (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    is_available boolean NOT NULL DEFAULT false, -- The manual toggle
    last_seen_at timestamptz NOT NULL DEFAULT now(),
    status text DEFAULT 'offline' -- 'online', 'offline', 'busy' (derived or explicit)
);

ALTER TABLE public.awy_presence ENABLE ROW LEVEL SECURITY;

-- RLS: Users can manage their own presence
CREATE POLICY "Users can manage their own presence" 
    ON public.awy_presence 
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- RLS: Students can see presence of their connected loved ones
CREATE POLICY "Students can see loved ones presence" 
    ON public.awy_presence 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.awy_connections c 
            WHERE c.student_id = auth.uid() 
            AND c.loved_one_id = public.awy_presence.user_id
            AND c.status = 'active'
        )
    );

-- RLS: Loved ones can see presence of their connected students ONLY if student is available
CREATE POLICY "Loved ones can see student presence" 
    ON public.awy_presence 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.awy_connections c 
            WHERE c.loved_one_id = auth.uid() 
            AND c.student_id = public.awy_presence.user_id
            AND c.status = 'active'
        )
        AND is_available = true -- Only visible if student explicitly allows
    );

-- 4. RPC: Link Loved One (Called when loved one signs up)
-- This function should be called via a trigger or manually when a loved one logs in
CREATE OR REPLACE FUNCTION public.awy_link_on_signup()
RETURNS TRIGGER AS $$
BEGIN
    -- If the new user has an email that matches a pending connection, link it
    UPDATE public.awy_connections 
    SET loved_one_id = NEW.id, status = 'active', updated_at = now()
    WHERE lower(loved_email) = lower(NEW.email) 
    AND loved_one_id IS NULL;
    
    -- Ensure profile exists with correct role if not already
    -- (This part might be handled by handle_new_user, but good to be safe)
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to link on signup
DROP TRIGGER IF EXISTS on_auth_user_created_link_awy ON auth.users;
CREATE TRIGGER on_auth_user_created_link_awy
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.awy_link_on_signup();

-- 5. RPC: Heartbeat
CREATE OR REPLACE FUNCTION public.awy_heartbeat(p_is_available boolean)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  INSERT INTO public.awy_presence (user_id, is_available, last_seen_at, status)
  VALUES (auth.uid(), p_is_available, now(), 'online')
  ON CONFLICT (user_id)
  DO UPDATE SET 
    is_available = EXCLUDED.is_available,
    last_seen_at = now(),
    status = 'online';
$$;
