# Phase 2: Canonical Data Model (Academic Items)

## 2.1 Core Principle

A single `academic_items` table acts as the master record for ALL "things" a student interacts with.
This solves the "Shadow Record" problem where `personal_items` (calendar) and `lectures` (content) drift apart.

## 2.2 Schema Design

### `academic_items` (The Source of Truth)

```sql
create table academic_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  type text not null check (type in ('lecture', 'assignment', 'event', 'quiz', 'note', 'revision')),

  -- Core metadata shared by all
  title text not null,
  description text,
  occurred_at timestamp with time zone, -- Lecture date, Assignment deadline, Event start

  -- Linkage
  module_id uuid references modules(id), -- If linked to a module

  -- Source tracking (Blind upsert support)
  source_refs jsonb default '{}'::jsonb,
  -- e.g. { "panopto_id": "...", "ics_uid": "...", "canvas_id": "..." }

  -- State machine (Unified)
  state jsonb default '{}'::jsonb,
  -- e.g. { "status": "processing", "progress": 0.5, "grade": "A" }

  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Indexes
create index idx_academic_items_user_date on academic_items(user_id, occurred_at);
create index idx_academic_items_refs on academic_items using gin (source_refs);
```

### Detail Tables (Reference academic_items.id)

#### `lecture_details` (extends academic_items)

- **id**: uuid PK (references academic_items.id) - _One-to-One enforcement_
- `audio_path`: text
- `panopto_url`: text
- `transcript_source`: text
- `processing_error`: text

#### `assignment_details` (extends academic_items)

- **id**: uuid PK (references academic_items.id)
- `brief_url`: text
- `submission_method`: text
- `word_count_target`: int

#### `event_details` (for pure calendar/timetable items)

- **id**: uuid PK
- `location`: text
- `end_time`: timestamp with time zone
- `is_all_day`: boolean

## 2.3 Migration Strategy (Safe)

We will NOT drop existing tables immediately. usage will be migrated linearly.

1.  **Create** `academic_items`.
2.  **Backfill**:
    - Iterate `lectures`: Insert into `academic_items` (type=lecture), set `occurred_at=lecture_date`.
    - Iterate `assignments`: Insert into `academic_items` (type=assignment), set `occurred_at=due_date`.
    - Iterate `timetable_events`: Insert into `academic_items` (type=event).
3.  **Link**:
    - Add `academic_item_id` column to `lectures`, `assignments`, etc. (initially nullable).
    - Update rows with the newly created IDs.
    - Make `academic_item_id` NOT NULL and Unique.
4.  **Switch Backend**:
    - Update `process.ts` to create `academic_items` row first, then `lectures` row.
5.  **Switch Frontend**:
    - Update Dashboard to query `academic_items`.

## 2.4 Fixing Lecture AI Regression

The new processing flow will be:

1.  **Upload**: Create `academic_items` (status=uploading) + `lecture_details`.
2.  **Process**:
    - Update `academic_items.state->status = 'processing'`.
    - Run OpenAI job.
    - On success: `academic_items.state->status = 'ready'`, Create `lecture_notes` linked to `academic_item_id`.
    - On fail: `academic_items.state->status = 'failed'`, `academic_items.state->error = '...'`.

**Why this fixes it**:

- No more ambiguity between `lectures.status` and `personal_items` status.
- Frontend always checks `academic_items.state`.
- If `lecture_notes` missing but status=ready, we can detect mismatched state easily.
