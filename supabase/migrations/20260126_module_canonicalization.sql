-- Migration: Module Canonicalization
-- Date: 2026-01-26
-- Description: Introduces module_catalog (seeded) and user_modules for authoritative module management.

BEGIN;

-- 1. Create Module Catalog (The Source of Truth)
CREATE TABLE IF NOT EXISTS public.module_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    year_level INTEGER CHECK (year_level IN (1, 2, 3, 4)),
    term TEXT DEFAULT 'Michaelmas',
    is_core BOOLEAN DEFAULT FALSE,
    credits INTEGER DEFAULT 20,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Read-only for public/authenticated, Admin write)
ALTER TABLE public.module_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Catalog is viewable by everyone" ON public.module_catalog
    FOR SELECT USING (true);

-- 2. Seed Data (from data/modules.csv)
INSERT INTO public.module_catalog (code, title, year_level, is_core, credits)
VALUES 
    ('LAW101', 'Legal Methods & Reasoning', 1, true, 20),
    ('LAW102', 'Contract Law', 1, true, 20),
    ('LAW103', 'Tort Law', 1, true, 20),
    ('LAW104', 'Criminal Law', 1, true, 20),
    ('LAW105', 'Public Law (Constitutional & Administrative)', 1, true, 20),
    ('LAW199', 'Foundations Portfolio', 1, false, 20),
    ('LAW201', 'Land Law', 2, true, 20),
    ('LAW202', 'Equity & Trusts', 2, true, 20),
    ('LAW203', 'EU Law', 2, false, 20),
    ('LAW204', 'Commercial Law', 2, false, 20),
    ('LAW205', 'Company Law', 2, false, 20),
    ('LAW299', 'Research & Writing Workshop', 2, false, 20),
    ('LAW301', 'Jurisprudence', 3, true, 20),
    ('LAW302', 'Evidence', 3, false, 20),
    ('LAW303', 'International Law', 3, false, 20),
    ('LAW304', 'Human Rights Law', 3, false, 20),
    ('LAW305', 'Family Law', 3, false, 20),
    ('LAW306', 'Intellectual Property Law', 3, false, 20),
    ('LAW399', 'Dissertation / Project', 3, false, 40)
ON CONFLICT (code) DO UPDATE SET 
    title = EXCLUDED.title,
    year_level = EXCLUDED.year_level,
    is_core = EXCLUDED.is_core,
    credits = EXCLUDED.credits;


-- 3. Create User Modules (The Enrollment Table)
CREATE TABLE IF NOT EXISTS public.user_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    catalog_id UUID NOT NULL REFERENCES public.module_catalog(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, catalog_id)
);

-- RLS for User Modules
ALTER TABLE public.user_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own modules" ON public.user_modules
    FOR ALL USING (auth.uid() = user_id);

-- 4. Backfill: Map existing 'junk' modules to canonical catalog
-- This looks at the users' existing 'modules' table, tries to find a matching code in 'module_catalog',
-- and creates a 'user_modules' entry.
INSERT INTO public.user_modules (user_id, catalog_id, status)
SELECT DISTINCT 
    m.user_id, 
    c.id as catalog_id, 
    'active'
FROM public.modules m
JOIN public.module_catalog c ON m.code = c.code
ON CONFLICT (user_id, catalog_id) DO NOTHING;

COMMIT;
