-- Fix RLS for Assignment and Exam Durmah message persistence
-- Detected schema:
-- - assignment_sessions table has: id, assignment_id, user_id, title
-- - assignment_session_messages table has: id, session_id (foreign key), role, content, created_at, user_id
-- - exam_sessions table has: id, module_id, user_id, title
-- - exam_messages table has: id, session_id (foreign key), role, content, created_at, user_id

-- 1. ASSIGNMENT SESSIONS & MESSAGES
alter table public.assignment_sessions enable row level security;

drop policy if exists "as_select_own" on public.assignment_sessions;
create policy "as_select_own" on public.assignment_sessions
for select to authenticated using (user_id = auth.uid());

drop policy if exists "as_insert_own" on public.assignment_sessions;
create policy "as_insert_own" on public.assignment_sessions
for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "as_update_own" on public.assignment_sessions;
create policy "as_update_own" on public.assignment_sessions
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.assignment_session_messages enable row level security;

drop policy if exists "asm_select_own" on public.assignment_session_messages;
create policy "asm_select_own" on public.assignment_session_messages
for select to authenticated
using (
  exists (
    select 1
    from public.assignment_sessions s
    where s.id = assignment_session_messages.session_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists "asm_insert_own" on public.assignment_session_messages;
create policy "asm_insert_own" on public.assignment_session_messages
for insert to authenticated
with check (
  exists (
    select 1
    from public.assignment_sessions s
    where s.id = assignment_session_messages.session_id
      and s.user_id = auth.uid()
  )
);

-- 2. EXAM SESSIONS & MESSAGES (Hardening)
alter table public.exam_sessions enable row level security;

drop policy if exists "es_select_own" on public.exam_sessions;
create policy "es_select_own" on public.exam_sessions
for select to authenticated using (user_id = auth.uid());

drop policy if exists "es_insert_own" on public.exam_sessions;
create policy "es_insert_own" on public.exam_sessions
for insert to authenticated with check (user_id = auth.uid());

alter table public.exam_messages enable row level security;

drop policy if exists "em_select_own" on public.exam_messages;
create policy "em_select_own" on public.exam_messages
for select to authenticated
using (
  exists (
    select 1
    from public.exam_sessions s
    where s.id = exam_messages.session_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists "em_insert_own" on public.exam_messages;
create policy "em_insert_own" on public.exam_messages
for insert to authenticated
with check (
  exists (
    select 1
    from public.exam_sessions s
    where s.id = exam_messages.session_id
      and s.user_id = auth.uid()
  )
);
