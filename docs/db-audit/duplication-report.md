# Phase 1: Schema Audit & Duplication Report

## 1.1 Key Entities & Tables

### Content Entities

- **Lectures**: `lectures` (primary), `lecture_notes`, `lecture_transcripts`, `lecture_chat_messages`.
- **Assignments**: `assignments` (primary), `assignment_briefs`, `assignment_files`, `assignment_progress`, `assignment_submissions`.
- **Quizzes**: `quiz_sessions` (primary?), `quiz_messages`.
- **Revisions**: `revision_items`.
- **Generic Uploads**: `documents`.

### Scheduling & Planning

- **Timetable**: `timetable_events` (imported from seed/ICS?).
- **Personal Items**: `personal_items` (user-created tasks/events).
  - Has `original_timetable_id` and `assignment_id` pointers.
- **Calendar**: Implicitly formed by `timetable_events` + `assignments.due_date` + `personal_items`.

## 1.2 Duplication & Drift Analysis

### "Shadow" Records (Major Issue)

- `personal_items` acts as a shadow table for `lectures` and `assignments` when they appear on the calendar/todo list.
  - **Drift Risk**: If `assignments.due_date` changes, does `personal_items.end_at` update?
  - **ID Confusion**: Frontend uses `personal_items.id` for calendar clicks, but `assignments.id` for detail views.

### Content Fragmentation

- `lectures` vs `timetable_events`: A lecture exists in the timetable (as an event) AND as a recording (in `lectures`).
  - Currently `lectures` has `lecture_date`.
  - `timetable_events` has `start_time` / `end_time`.
  - No clear FK linking `lectures` -> `timetable_events`.

### Generic vs Specific Storage

- `documents` table stores user uploads.
- `assignment_files` stores assignment-specific uploads.
- `assignment_briefs` stores brief files.
- `lectures` has `audio_path`.
- **Problem**: No single "File" entity. Upload logic is duplicated across features.

### Missing FKs / Orphans

- `quiz_sessions.target_id` is generic UUID. No FK constraint to `lectures` or `assignments`.
- `personal_items.assignment_id` is nullable UUID, likely has FK.
- `personal_items.original_timetable_id` is nullable UUID.

## 1.3 Canonical ID Proposal (Preview)

We need a unified `academic_items` table to be the parent of all:

- Lecture recording
- Assignment
- Calendar Event (Timetable slot)
- Personal Task
- Quiz Session

This allows:

1.  Universal "Calendar View" querying `academic_items` (occurred_at).
2.  Universal "Dashboard / Search".
3.  Single ID to pass to "Durmah" context.
