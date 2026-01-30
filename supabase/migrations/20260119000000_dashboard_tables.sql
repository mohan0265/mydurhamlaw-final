-- Migration: Create tables for Dashboard widgets (Tasks, Journal)

-- 1. User Tasks Table
create table if not exists public.user_tasks (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    due_date date,
    status text not null default 'open' check (status in ('open', 'completed')),
    created_at timestamptz default now()
);

-- Enable RLS
alter table public.user_tasks enable row level security;

-- Policies for user_tasks
create policy "Users can view own tasks"
    on public.user_tasks for select
    using (auth.uid() = user_id);

create policy "Users can insert own tasks"
    on public.user_tasks for insert
    with check (auth.uid() = user_id);

create policy "Users can update own tasks"
    on public.user_tasks for update
    using (auth.uid() = user_id);

create policy "Users can delete own tasks"
    on public.user_tasks for delete
    using (auth.uid() = user_id);

-- 2. Journal Entries Table
create table if not exists public.journal_entries (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    content text not null,
    created_at timestamptz default now()
);

-- Enable RLS
alter table public.journal_entries enable row level security;

-- Policies for journal_entries
create policy "Users can view own journal entries"
    on public.journal_entries for select
    using (auth.uid() = user_id);

create policy "Users can insert own journal entries"
    on public.journal_entries for insert
    with check (auth.uid() = user_id);

create policy "Users can update own journal entries"
    on public.journal_entries for update
    using (auth.uid() = user_id);

create policy "Users can delete own journal entries"
    on public.journal_entries for delete
    using (auth.uid() = user_id);

-- 3. Wellbeing Check-ins (Optional but requested if quick)
create table if not exists public.wellbeing_checkins (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    mood integer check (mood >= 1 and mood <= 5),
    note text,
    created_at timestamptz default now()
);

-- Enable RLS
alter table public.wellbeing_checkins enable row level security;

create policy "Users can manage own wellbeing checkins"
    on public.wellbeing_checkins for all
    using (auth.uid() = user_id);
