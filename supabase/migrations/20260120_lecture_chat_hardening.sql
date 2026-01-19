-- Hardening migration for Lecture Chat

-- 1. Add indexes for performance
create index if not exists idx_lecture_chat_messages_user_lecture_created 
  on public.lecture_chat_messages (user_id, lecture_id, created_at);

create index if not exists idx_lecture_chat_messages_lecture_id 
  on public.lecture_chat_messages (lecture_id);

-- 2. Add thread_id (optional for now, but good for future threading)
alter table public.lecture_chat_messages 
  add column if not exists thread_id uuid default gen_random_uuid();

-- 3. Add telemetry columns (optional)
alter table public.lecture_chat_messages 
  add column if not exists model text,
  add column if not exists usage_tokens int;

-- 4. Ensure RLS is enabled (idempotent)
alter table public.lecture_chat_messages enable row level security;

-- 5. Ensure Wellbeing RLS (if table exists)
do $$
begin
  if exists (select from pg_tables where schemaname = 'public' and tablename = 'wellbeing_entries') then
    alter table public.wellbeing_entries enable row level security;
    
    -- Drop existing policies to be safe/update them
    drop policy if exists "Users can view own wellbeing" on public.wellbeing_entries;
    drop policy if exists "Users can insert own wellbeing" on public.wellbeing_entries;
    
    create policy "Users can view own wellbeing"
      on public.wellbeing_entries for select
      using (auth.uid() = user_id);

    create policy "Users can insert own wellbeing"
      on public.wellbeing_entries for insert
      with check (auth.uid() = user_id);
  end if;
end
$$;
