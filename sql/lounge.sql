-- messages
create table if not exists public.lounge_messages (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  username text not null,
  text text not null,
  created_at timestamptz not null default now()
);
-- shoutouts
create table if not exists public.lounge_shoutouts (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- RLS (adjust to your auth; for MVP allow anon read/insert)
alter table public.lounge_messages enable row level security;
create policy "messages read" on public.lounge_messages for select using (true);
create policy "messages insert" on public.lounge_messages for insert with check (true);

alter table public.lounge_shoutouts enable row level security;
create policy "shoutouts read" on public.lounge_shoutouts for select using (true);
create policy "shoutouts insert" on public.lounge_shoutouts for insert with check (true);

-- Realtime
alter publication supabase_realtime add table public.lounge_messages;
alter publication supabase_realtime add table public.lounge_shoutouts;
