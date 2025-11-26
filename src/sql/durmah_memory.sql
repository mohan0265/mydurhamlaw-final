-- Durmah Memory Table
-- Stores the last conversation context for the Durmah AI agent per user.

create table if not exists public.durmah_memory (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_topic text,
  last_message text,
  last_seen_at timestamptz not null default now()
);

-- RLS Policies
alter table public.durmah_memory enable row level security;

drop policy if exists "Users can view their own memory" on public.durmah_memory;
create policy "Users can view their own memory"
  on public.durmah_memory for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update their own memory" on public.durmah_memory;
create policy "Users can update their own memory"
  on public.durmah_memory for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own memory (update)" on public.durmah_memory;
create policy "Users can update their own memory (update)"
  on public.durmah_memory for update
  using (auth.uid() = user_id);
