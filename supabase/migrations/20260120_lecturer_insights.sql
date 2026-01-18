-- 20260120_lecturer_insights.sql

-- 1) LECTURERS TABLE
create table if not exists public.lecturers (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    name_normalized text generated always as (lower(trim(name))) stored,
    created_at timestamptz default now(),
    unique(name_normalized)
);

alter table public.lecturers enable row level security;
-- Viewable by everyone (public knowledge)
create policy "lecturers_select_policy" on public.lecturers for select using (true);
-- Insertable by service role only (via backend processing)

-- 2) LECTURER INSIGHTS
create table if not exists public.lecturer_insights (
    id uuid primary key default gen_random_uuid(),
    lecturer_id uuid references public.lecturers(id) on delete cascade unique,
    lecture_count int default 0,
    insights_json jsonb not null default '{}'::jsonb,
    updated_at timestamptz default now()
);

alter table public.lecturer_insights enable row level security;
-- Viewable by everyone
create policy "lecturer_insights_select_policy" on public.lecturer_insights for select using (true);

-- 3) LECTURER FEEDBACK (Private to student)
create table if not exists public.lecturer_feedback (
    id uuid primary key default gen_random_uuid(),
    lecturer_id uuid references public.lecturers(id) on delete cascade,
    user_id uuid references auth.users(id) on delete cascade,
    pace text check (pace in ('too_fast','ok','too_slow')),
    clarity text check (clarity in ('clear','mixed','unclear')),
    examples text check (examples in ('more','ok')),
    best_tip text, -- Encrypted or filtered in app logic (optional), stored plain for now but RLS restriction
    created_at timestamptz default now(),
    unique(lecturer_id, user_id)
);

alter table public.lecturer_feedback enable row level security;
-- Users can only see/insert/update their own feedback
create policy "lecturer_feedback_select_own" on public.lecturer_feedback for select using (auth.uid() = user_id);
create policy "lecturer_feedback_insert_own" on public.lecturer_feedback for insert with check (auth.uid() = user_id);
create policy "lecturer_feedback_update_own" on public.lecturer_feedback for update using (auth.uid() = user_id);
