# Supabase RLS Fix for Assignment Chat Deletion

## Problem Summary
The "Clear Chat" function for Assignment Chat was appearing to work in the UI (showing "Session discarded"), but messages would reappear upon page refresh. Investigation revealed that while the client-side code was correctly targeting the `assignment_session_messages` and `assignment_sessions` tables, the **Supabase RLS (Row Level Security)** policies were silently blocking the `DELETE` operations because no explicit delete policy existed for these tables.

## Affected Tables
- `assignment_sessions`: Central session record for each assignment chat.
- `assignment_session_messages`: All messages (User and Assistant) associated with a session.

## Ownership Rule
- Common owner column: `user_id` (UUID).
- Rule: A logged-in user (`auth.uid()`) can manage (SELECT, INSERT, DELETE) their own assignment sessions and all messages belonging to those sessions.

## Implemented Policies
Applied on **2026-01-23** via Browser Agent:

### 1. assignment_sessions
- **select_own_assignment_sessions**: `(user_id = auth.uid())`
- **insert_own_assignment_sessions**: `(user_id = auth.uid())`
- **delete_own_assignment_sessions**: `(user_id = auth.uid())`

### 2. assignment_session_messages
Policies use an `EXISTS` check against the parent session to ensure ownership, even for assistant messages where `user_id` might be null.
- **select_own_assignment_session_messages**:
  ```sql
  exists (
    select 1 from public.assignment_sessions s
    where s.id = assignment_session_messages.session_id
      and s.user_id = auth.uid()
  )
  ```
- **insert_own_assignment_session_messages**: Same `EXISTS` check.
- **delete_own_assignment_session_messages**: Same `EXISTS` check.

## Verification
- Confirmed row deletion in Table Editor for session `c042d321-...` after clicking "Clear Chat".
- Refresh results in 0 messages fetched.
