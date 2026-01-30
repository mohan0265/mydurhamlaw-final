-- Select-to-Save Migration

-- A) Lecture Chat Extension
alter table public.lecture_chat_messages
  add column if not exists saved_at timestamptz null,
  add column if not exists session_id uuid not null default gen_random_uuid(),
  add column if not exists message_kind text not null default 'chat' check (message_kind in ('chat'));

create index if not exists idx_lecture_chat_session on public.lecture_chat_messages (user_id, lecture_id, session_id);
create index if not exists idx_lecture_chat_saved on public.lecture_chat_messages (user_id, lecture_id, saved_at);

-- Policies for Lecture Chat (Update/Delete)
create policy "Users can update own lecture messages"
  on public.lecture_chat_messages for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own lecture messages"
  on public.lecture_chat_messages for delete
  using (auth.uid() = user_id);

-- B) Durmah Widget Extension
-- Assuming table is 'durmah_messages' based on review
alter table public.durmah_messages
  add column if not exists saved_at timestamptz null,
  add column if not exists session_id uuid not null default gen_random_uuid();

create index if not exists idx_durmah_messages_saved on public.durmah_messages (user_id, saved_at);
create index if not exists idx_durmah_messages_session on public.durmah_messages (user_id, session_id);

-- Policies for Durmah Messages (Update/Delete)
-- Check if policies exist first or just creating them safely
do $$
begin
  if not exists (select from pg_policies where tablename = 'durmah_messages' and policyname = 'Users can update own durmah messages') then
    create policy "Users can update own durmah messages"
      on public.durmah_messages for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (select from pg_policies where tablename = 'durmah_messages' and policyname = 'Users can delete own durmah messages') then
    create policy "Users can delete own durmah messages"
      on public.durmah_messages for delete
      using (auth.uid() = user_id);
  end if;
end
$$;
