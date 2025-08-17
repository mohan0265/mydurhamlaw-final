create table if not exists public.voice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  assistance_level text check (assistance_level in ('L1','L2','L3')) default 'L1',
  page_context text,
  started_at timestamptz default now(),
  ended_at timestamptz,
  duration_ms int
);

alter table public.voice_sessions enable row level security;

create policy "Allow user to access their own voice sessions" on public.voice_sessions
  for all using (auth.uid() = user_id);
