# Caseway — MVP Polish Roadmap (Single Source of Truth)

Purpose:

- Keep all audit findings and upgrades tracked in one place.
- Execute in small phases so AG never receives “too big” instructions.
- Each phase has a Definition of Done (DoD) + verification checklist.

Last updated: 2026-01-27

---

## Guiding Principles (Non-negotiable)

1. Trust first:

- Independence + academic integrity must be visible early, not buried in footer.

2. No hard blocks:

- Exam Prep / Assignments should not feel “locked” behind lecture uploads.
- Uploads improve intelligence, but the core should remain usable.

3. Stress-safe UX:

- Calm tone. No shame labels. Deadlines shown as guidance, not judgement.

4. Demo > promises:

- Every major widget page must show how to use it with visuals and 3-step guidance.

5. AG execution discipline:

- One phase per prompt.
- Provide acceptance criteria + manual verification steps.
- Require AG to output a “Changed files list” + “How to verify” at the end.

---

## Phase 0 — Trust + First-minute clarity (P0)

Goal:
Make the first minute feel safe, credible, and obvious.

Scope:

- Homepage: surface independence + integrity earlier (near hero).
- Signup: repeat independence + integrity line before Google sign-in.
- Navigation: remove any mixed “request access” signals for students; one primary path.
- Post-login: show a short “Where to start” banner (no confusion after redirect).

Definition of Done:

- A new user can answer: “Is this official Durham?” “Is it safe?” “What do I click first?”

Verification:

- Logged out: / + /pricing + /signup show independence & integrity within first screen.
- Logged in: first page after login includes “Start here” guidance.

---

## Phase 1 — Guided Empty States (P0/P1)

Goal:
Every key page teaches setup in under 60 seconds.

Targets:

1. My Lectures (/study/lectures)

- 3-step setup strip
- “Ways to add” (upload transcript PDF / paste text / upload notes)
- Visual placeholder (screenshot/diagram)
- Demo video placeholder (later replace)
- “What you get after upload” outcomes list

2. Exam Prep (/exam-prep)

- Empty state explains: usable now; lectures make it smarter
- Visual flow: pick module → choose focus → generate practice → track progress

3. Assignments (/assignments)

- Empty state explains how to use “Plan with Durmah”
- Shows what a good checklist/milestone looks like

Definition of Done:

- No major page feels empty or confusing; every empty state is actionable.

Verification:

- Create new test user with no data; visit these pages and confirm guidance blocks appear.

---

## Phase 2 — Assessment Intelligence (P1)

Input:

- Student-uploaded “Summatives / Assessments” PDF (example: SUMMATIVES.pdf).

Goal:
Auto-populate YAAG + Assignments + Exam Prep with real, Durham-accurate assessment structure.

Scope:

- Onboarding: optional “Upload Summatives PDF (recommended)” step.
- Parse + store assessment rows (module, type, weight, due date, exam window, exam duration).
- YAAG: show assessment deadlines inside the academic year.
- Assignments: generate real summatives when available.
- Exam Prep: show exam cards even with zero lecture uploads.

Definition of Done:

- Uploading PDF produces visible improvements across 3 areas within 1 minute.

Verification:

- Upload test PDF → check:
  - YAAG shows new deadlines
  - Assignments list contains real items
  - Exam Prep shows module exam cards

---

## Phase 3 — Stress-safe UX polish (P1/P2)

Goal:
Make Caseway feel like a calm tutor, not a panic dashboard.

Scope:

- Replace “NOT STARTED” with supportive labels (“Ready to begin”, “Next step available”).
- Replace aggressive countdown styling with calm “Due in X days” language.
- Add “Suggested next 30 minutes” CTA in assignment context.
- Ensure empty state copy never implies judgement.

Definition of Done:

- Students feel encouraged on first use, even if behind.

Verification:

- Use an assignment due soon and ensure tone stays calm and helpful.

---

## Phase 4 — Demo Layer (P2)

Goal:
Make it a no-brainer in one glance.

Scope:

- Add screenshots/diagrams to “How it works” or widget pages.
- Add short demo video embed placeholders (later replace with recordings).
- Add “What you achieve in 14 days” list on homepage/pricing.

Definition of Done:

- Landing pages feel “real” and proven, not abstract.

Verification:

- New visitor can understand benefits without scrolling deep or guessing.

---

## Current Sprint Rules (for AG prompts)

For each sprint prompt:

1. Include scope-limited objectives (max 3–5 changes).
2. Require AG to list:
   - Files changed
   - Exact behavior changes
   - Manual checks (step-by-step)
3. Do NOT mix unrelated features in one sprint.
4. Avoid large refactors unless explicitly planned.

---

## Backlog (Later)

- Blackboard/Panopto integration guidance (no credentials required)
- “Live Legal News” habit loop: Read → Link to module → 30-sec reflection → archive
- Better onboarding tour + first-run checklist
- More real student testimonials (pilot phrasing, no “coming soon”)
