-- Durmah Voice System Schema Migration
-- Creates tables for voice sessions and messages with proper structure

-- Create durmah_sessions table (if not exists with correct structure)
create table if not exists public.durmah_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mode text check (mode in ('push', 'continuous')) default 'push',
  title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create durmah_messages table (if not exists with correct structure)
create table if not exists public.durmah_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.durmah_sessions (id) on delete cascade,
  role text check (role in ('user', 'assistant')) not null,
  content text not null,
  audio_url text,
  transcription_confidence real,
  created_at timestamptz default now()
);

-- Create indexes for performance
create index if not exists idx_durmah_sessions_user_id on public.durmah_sessions (user_id);
create index if not exists idx_durmah_sessions_created_at on public.durmah_sessions (created_at desc);
create index if not exists idx_durmah_messages_session_id on public.durmah_messages (session_id);
create index if not exists idx_durmah_messages_created_at on public.durmah_messages (created_at);

-- Enable Row Level Security
alter table public.durmah_sessions enable row level security;
alter table public.durmah_messages enable row level security;

-- RLS Policies for durmah_sessions
create policy "Users can view their own durmah sessions" 
  on public.durmah_sessions for select 
  using (auth.uid() = user_id);

create policy "Users can create their own durmah sessions" 
  on public.durmah_sessions for insert 
  with check (auth.uid() = user_id);

create policy "Users can update their own durmah sessions" 
  on public.durmah_sessions for update 
  using (auth.uid() = user_id);

create policy "Users can delete their own durmah sessions" 
  on public.durmah_sessions for delete 
  using (auth.uid() = user_id);

-- RLS Policies for durmah_messages
create policy "Users can view messages from their sessions" 
  on public.durmah_messages for select 
  using (
    exists (
      select 1 from public.durmah_sessions 
      where id = session_id and user_id = auth.uid()
    )
  );

create policy "Users can create messages in their sessions" 
  on public.durmah_messages for insert 
  with check (
    exists (
      select 1 from public.durmah_sessions 
      where id = session_id and user_id = auth.uid()
    )
  );

create policy "Users can update messages in their sessions" 
  on public.durmah_messages for update 
  using (
    exists (
      select 1 from public.durmah_sessions 
      where id = session_id and user_id = auth.uid()
    )
  );

create policy "Users can delete messages from their sessions" 
  on public.durmah_messages for delete 
  using (
    exists (
      select 1 from public.durmah_sessions 
      where id = session_id and user_id = auth.uid()
    )
  );

-- Create updated_at trigger for durmah_sessions
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language 'plpgsql';

create trigger update_durmah_sessions_updated_at
  before update on public.durmah_sessions
  for each row
  execute function update_updated_at_column();

-- Optional: Cleanup function for old sessions
create or replace function cleanup_old_durmah_sessions(days_to_keep integer default 30)
returns integer as $$
declare
  deleted_count integer;
begin
  -- Delete sessions older than specified days
  with deleted as (
    delete from public.durmah_sessions 
    where created_at < now() - interval '1 day' * days_to_keep
    returning id
  )
  select count(*) into deleted_count from deleted;
  
  return deleted_count;
end;
$$ language 'plpgsql' security definer;

-- Grant necessary permissions
grant usage on schema public to anon, authenticated;
grant all privileges on table public.durmah_sessions to authenticated;
grant all privileges on table public.durmah_messages to authenticated;