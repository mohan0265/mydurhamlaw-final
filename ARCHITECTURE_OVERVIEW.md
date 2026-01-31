# ARCHITECTURE_OVERVIEW.md

## Project: Caseway

> A world-class academic + wellbeing companion app for Durham University law students.  
> Built on **Next.js 14 (Pages Router)** + **Supabase (Auth, Postgres, Realtime)** + **Netlify Functions**.  
> Voice runs as a separate, pluggable widget (`Durmah-Legal-Buddy`) so this repo stays clean and web-only.

---

## 🧠 North Star & Purpose

**Durmah** should greet a signed-in student by name, know their **year**, and understand the **current academic phase** (all logic in **Europe/London**). It tailors answers, opens the right YAAG views, gives nudges, and offers fast actions.

Beyond orientation, we expand to:

- **Premier Lounge** – a presence-enabled, private-but-campus-wide lounge for Durham Law undergrads to network, DM, and help each other (see details below).
- **Durham Community Page** – a city-wide guide for students to connect with **Durham life** beyond campus (events, places, services).
- **Always With You (AWY)** – an opt-in presence link to loved ones with **one-click video calls**.
- **Academic Support** – topic pages and practice powered by **ChatGPT Study Mode** for world-class tutoring.

**Why:** help Durham Law students **stay oriented**, **feel supported**, and **succeed academically**.

---

## 🌐 Deployment

- **Frontend:** Next.js 14 (Pages Router under `/src/pages`)
- **Hosting:** Netlify
- **Serverless:** Netlify Functions (`/netlify/functions`)
- **DB/Auth:** Supabase (Postgres + RLS + Realtime)
- **AI:** GPT-4o endpoints (Study Mode integration lives on the Academic pages)
- **Voice:** External widget (`Durmah-Legal-Buddy`) injected via `<DurmahWidget/>` only when enabled

---

## 🗂️ Key Repo Structure

/src
├─ components/ # UI + shared components (Greeter, cards, etc.)
├─ features/ # Calendar, News, Academic tools, AWY, Lounge
├─ lib/
│ ├─ durham/ # Durham-specific data/utilities (modules, calendar)
│ ├─ durmah/ # Student context + academic phase/date logic
│ └─ supabase/ # client, bridge, auth helpers
├─ pages/ # Routes (Pages Router)
└─ styles/ # Tailwind + globals
/netlify/functions # Serverless APIs (chat, calendar, presence, calls, study-mode)
/database-schema # SQL and migrations
/public # Assets

markdown
Copy code

---

## 👥 User Types

| User Type          | Dashboard Route         |
| ------------------ | ----------------------- |
| Foundation         | `/dashboard/foundation` |
| Year 1             | `/dashboard/year1`      |
| Year 2             | `/dashboard/year2`      |
| Year 3             | `/dashboard/year3`      |
| Post-Grad (coming) | `/dashboard/postgrad`   |

Assigned via `profiles.user_type` and user metadata; Durmah context **gates** detailed views by `yearKey`.

---

## 📅 YAAG & Academic Calendar

- Year-At-A-Glance (YAAG): `/pages/year-at-a-glance/*.tsx`
- Calendar data flows via `src/lib/hooks/useCalendarData.ts` + serverless routes.
- Deep links and date clamps are driven by **Durmah phase** helpers (all London-time).

---

## ✅ Current Status (P0) — What’s Live

**Goal:** create a **single source of truth** for student context + a first-run Greeter.

**Added/Updated Files**

- `src/lib/durmah/phase.ts` — London-time helpers & canonical AY **2025/26** dates
  - `todayISOInTZ`, `computeNowPhase`, `computeDaysUntil`
  - Deep links: `defaultMonthDeepLink`, `weekOneLink`
- `src/lib/durmah/context.tsx` — React **provider** + `useDurmah()`; bootstraps `window.__mdlStudentContext`
- `src/components/durmah/Greeter.tsx` — first message UI: name, year, countdowns, quick actions
- `src/lib/supabase/supabaseBridge.ts` — builds context from Supabase session (`@/lib/supabase/client`)
- `src/pages/_app.tsx` — wraps app with `DurmahProvider`; refreshes on auth/profile changes
- `src/data/durmah/seed.json` — initial anchors (dates/FAQ)

**Acceptance checks (P0)**

- Signed-in test `{ firstName:'Alex', yearKey:'year1' }` → personalized greeter + correct countdowns
- Before 29 Sep 2025: “Open October month view” → `/year-at-a-glance/month?y=year1&ym=2025-10`
- “Week 1 prep checklist” → `/year-at-a-glance/week?y=year1&start=2025-10-06`
- Logic strictly **Europe/London**; detailed Month/Week gated by student’s **own `yearKey`**
- Safe fallbacks: anonymous → invite sign-in; missing year → default **Year 1**

**Build/config notes**  
`tsconfig.json` must include:

```json
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": { "@/*": ["*"] },
    "resolveJsonModule": true
  }
}
⚠️ Durmah Voice Integration
All real-time voice code is removed from this repo. Voice docks through a floating widget (DurmahWidget.tsx) and external endpoints. This keeps the web app stable and reduces build risk.

🚧 Next Builds (Blueprint & Specs)
1) Always With You (AWY) — presence & one-click video
A gentle, opt-in emotional tether to trusted loved ones (parent/partner). Students can:

See a loved one’s online status (only if that person opted-in)

Share their own availability windows (“free to talk” for N minutes)

Tap to call → instant WebRTC video call in browser

UX & Privacy

Double-opt-in with explicit consent; time-boxed availability; quiet hours / DND

Presence states: green/amber/red (available/soon/busy)

Invite flow: email link → one-time consent page → store contact in loved_ones

Abuse protection: rate-limited invites, report/block, audit trail

Tech design

Presence: Supabase Realtime channels presence:awy:{user_id}, heartbeat (TTL)

Calls: WebRTC; signaling via Netlify Function call-signal + Supabase Realtime

Tables

loved_ones (id, student_id, display_name, contact_email, verified_at, blocked_at)

presence_status (user_id, status, expires_at, updated_at)

call_sessions (id, caller_id, callee_id, started_at, ended_at, status, reason)

Files (planned)

src/features/awy/PresenceSwitch.tsx

src/features/awy/LovedOnesList.tsx

src/features/awy/CallButton.tsx / CallRoom.tsx

src/pages/settings/awy.tsx (privacy, invitations)

/netlify/functions/call-signal.ts

Done criteria

End-to-end video call between two verified contacts

Presence changes reflect within < 2s; consent recorded; GDPR/DPA compliant

2) Premier Lounge — campus-wide presence + networking (opt-in directory)
A private, moderated lounge where all Durham Law undergrads can opt-in to show their online status to fellow Caseway members. Each student appears with name + year of study, giving everyone (same year, seniors, juniors) a safe way to request connect, send DMs, and build friendships. There’s space to express themselves, post “help wanted” messages, and support each other—especially useful for introverts who find it hard to approach peers in person.

Capabilities

Presence directory (opt-in): green/amber/red; quick filters (same year / seniors / juniors)

Connect request → accepted connections unlock DMs

Lounge feed: quick posts, help requests, check-ins, reactions, file/image attachments

“Study together” pings → time-boxed study room (Meet/WebRTC)

Optional anonymity for wellbeing posts (moderated)

Profile card shows name, year, and optional focus tags (e.g., “EU law”, “Mooting”)

Data

presence_status_public (user_id, status, expires_at, updated_at) — separate from AWY (AWY is private; this is campus-public)

connections (id, requester_id, addressee_id, status, created_at)

dm_threads (id, created_at) / dm_members (thread_id, user_id) / dm_messages (thread_id, sender_id, body, created_at)

lounge_posts (id, author_id, year_key, body, media_url, is_anon, created_at)

lounge_replies (id, post_id, author_id, body, created_at)

lounge_reactions (id, post_id, user_id, emoji, created_at)

Pages/Components

src/pages/lounge/index.tsx (feed + presence sidebar; gate by verified Durham account)

src/pages/lounge/directory.tsx (presence directory with filters)

src/components/lounge/PostComposer.tsx, PostList.tsx, ReplyDrawer.tsx

src/components/lounge/ConnectButton.tsx, DmPanel.tsx, PresenceBadge.tsx

Moderation & Safety

Report queue, staff roles, rate limits, block/mute; auto-collapse heated threads

Clear community guidelines; “Do Not Disturb” hours respected in presence

3) Durham Community Page — city & neighbourhood life
A welcoming guide to Durham life beyond the university—especially helpful for international students settling in. It aggregates and curates:

Events (city festivals, markets, society nights, volunteering)

Places (libraries, parks, gyms, faith spaces)

Dining (student-friendly eats, dietary filters)

Shopping & essentials (groceries, stationery, home goods)

Transport & services (bus routes, NHS/walk-in, banks, phone plans)

Local guides & discounts relevant to students

Data

city_events (id, title, starts_at, ends_at, location, host, rsvp_link, source)

city_places (id, name, category, address, map_url, hours_json)

city_guides (id, title, body_md, tags, updated_at)

city_deals (id, vendor, summary, link, valid_until)

Pages

src/pages/community/index.tsx (curated feed + filters)

src/pages/community/events.tsx (calendar + list)

src/components/community/PlaceCard.tsx, EventCard.tsx, GuideCard.tsx

Sources

Mix of manual curation, student submissions (moderated), and safe RSS/API pulls.

4) Academic Support — with ChatGPT Study Mode
Topic-centric tutoring integrated into pages.

Flows

Topic page (e.g., Contract: Offer & Acceptance): overview, examples, pitfalls

Practice: stepwise questions, hints, rubric feedback

Explainers: “teach me like I’m new / exam-level / practitioner level”

Study Mode: ChatGPT’s structured session for targeted practice & retention

Data

tutoring_sessions (id, user_id, topic_id, started_at, ended_at, score, notes)

study_plans (id, user_id, plan_json, updated_at)

notes (id, user_id, topic_id, blocks_json)

flashcards (id, user_id, topic_id, front, back, efactor, interval, due_at)

Components & Functions

src/pages/learn/[topic].tsx

src/components/learn/TopicHero.tsx, PracticePanel.tsx, StudyModeDock.tsx

/netlify/functions/study-mode.ts (session orchestration + safety)

Done criteria

Topic page + practice set + Study Mode dock

Track per-topic mastery; export notes; spaced-repetition due list

🔐 Security, Privacy & Ethics
Full RLS enforcement; least-privilege policies

Two presence models:

AWY (private to loved ones; double consent; one-click calls)

Premier Lounge public presence (opt-in campus directory; DND respected)

Minimize PII; encrypt invites; short-lived tokens/rooms

Academic Integrity: tutor mode aids learning, not assignment outsourcing

📈 Observability
Client analytics (e.g., PostHog):
greeter_shown, open_month, week1_prep,
awy_toggle, call_started,
lounge_presence_on, lounge_connect_request, dm_sent, lounge_posted,
community_event_rsvp, place_view,
study_mode_start, practice_submit.

Serverless: structured logs with request IDs; alerting on error rate spikes.

🧪 QA & Accessibility
Unit tests for phase.ts at boundary dates (before/after 29 Sep & 6 Oct)

a11y checks on Greeter, AWY switches, Lounge directory, and DM flows

Performance: code-split heavy panels; clean up Realtime subscriptions on unmount

🚀 Roadmap to Launch
Milestone P0 (NOW) — Context & Greeter

✅ Files live (lib/durmah/*, components/durmah/Greeter, bridge, _app)

🔧 Keep build green on Netlify; smoke test countdowns & deep links

Milestone P1 — Presence & Lounge

AWY presence + 1:1 calls; Settings & consent flows

Premier Lounge MVP: presence directory (opt-in), connect requests, DMs, lounge feed + moderation

Milestone P2 — Community & Academic

Durham Community Page (events, places, guides, deals)

Academic Support v1: 3 topics with Study Mode, practice, notes, flashcards

Milestone P3 — Polish & Launch

Analytics, a11y, legal pages, onboarding, pricing (if applicable)

Release checklist → production → sign-up ready

🔧 Environment
Copy .env.example → .env.local and set:

makefile
Copy code
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
(Voice/extra endpoints are external and optional.)

## 💼 Operations & Infrastructure
- [Email & DNS Runbook](./docs/ops/EMAIL_DNS_RUNBOOK.md) — Authoritative DNS records & transactional mail setup.

📝 Contribution Rules
Keep this repo voice-free; use the widget for voice.

Respect @/* aliasing, London-time calendar logic, and year-gating.

Do not break next build; add tests for date math; document schema changes.

Update this overview on feature merges so everyone stays in sync.

📌 Status & Next Actions (living section)
Now: ensure green builds; verify Greeter on real profiles; confirm YAAG deep links.

Next: implement AWY presence + consent; Premier Lounge (presence directory, connect & DMs); Durham Community Page scaffold; first 3 Academic topics with Study Mode.

This document is the single source of truth for architecture, scope, and launch plan. Keep it updated.
```
