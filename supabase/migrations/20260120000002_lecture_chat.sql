-- Create table for storing per-lecture chat history
create table if not exists public.lecture_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lecture_id uuid not null references public.lectures (id) on delete cascade,
  role text check (role in ('user', 'assistant')) not null,
  content text not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.lecture_chat_messages enable row level security;

-- Policies
create policy "Users can view their own lecture chats"
  on public.lecture_chat_messages for select
  using (auth.uid() = user_id);

create policy "Users can insert their own lecture chats"
  on public.lecture_chat_messages for insert
  with check (auth.uid() = user_id);
