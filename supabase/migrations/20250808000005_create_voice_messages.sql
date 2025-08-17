create table if not exists public.voice_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.voice_sessions (id) on delete cascade,
  role text check (role in ('user','assistant')) not null,
  text text not null,
  created_at timestamptz default now()
);

alter table public.voice_messages enable row level security;

create policy "Allow user to access their own voice messages" on public.voice_messages
  for all using (exists (select 1 from public.voice_sessions where id = session_id and auth.uid() = user_id));
