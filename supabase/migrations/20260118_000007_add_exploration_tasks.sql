-- Migration: 20260118_000007_add_exploration_tasks.sql
-- Description: Adding exploration tasks to onboarding_tasks table

INSERT INTO public.onboarding_tasks (task_key, label, description, href, sort_order, optional)
VALUES
    ('visit_community', 'Visit the Community Hub', 'Discover societies, events, and opportunities.', '/community', 45, TRUE),
    ('visit_lounge', 'Enter the Premier Lounge', 'Connect with your year group and seniors.', '/lounge', 46, TRUE),
    ('visit_awy', 'Explore Always With You', 'A space for connection to your loved ones.', '/loved-one/dashboard', 47, TRUE)
ON CONFLICT (task_key) DO UPDATE SET
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    href = EXCLUDED.href,
    sort_order = EXCLUDED.sort_order,
    optional = EXCLUDED.optional;
