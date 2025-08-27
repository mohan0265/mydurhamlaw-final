# ARCHITECTURE_OVERVIEW.md

## Project: MyDurhamLaw

> A world-class academic + wellbeing companion app for Durham University law students.  
> Built on Next.js 14 + Supabase + OpenAI GPT-4o + Netlify.  
> Clean, modular, and voice-ready — but **all Durmah voice logic is removed from this repo** to allow seamless plug-in of our standalone `Durmah-Legal-Buddy` module.

---

## 🧠 Purpose

This is the **core repo** for the MyDurhamLaw platform, focused on law student mastery, wellbeing, and academic success — designed with precision for the 3-year undergraduate law program at Durham University.  

Voice and memory AI are integrated externally via the `Durmah` widget.  
This repo is clean, structured, and optimized for seamless performance and plug-in architecture.

---

## 🌐 Deployment

- **Frontend**: Next.js 14 (`pages/` dir, not App Router)
- **Backend**: Netlify Functions + Supabase
- **Auth**: Supabase Auth (RLS-secured, user types)
- **Database**: Supabase PostgreSQL
- **AI**: GPT-4o (via serverless endpoints), Claude/Gemini plugged in via local CLI
- **Hosting**: Netlify
- **Voice AI**: Externally managed (`Durmah-Legal-Buddy`)

---

## 🧩 User Types

| User Type         | Dashboard Route         |
|------------------|-------------------------|
| Foundation       | `/dashboard/foundation` |
| Year 1           | `/dashboard/year1`      |
| Year 2           | `/dashboard/year2`      |
| Year 3           | `/dashboard/year3`      |
| Post-Grad/PhD (coming soon)| `/dashboard/postgrad`        |

- Assigned via `profiles.user_type` and `auth.metadata`
- Context-aware AI and layout based on user level

---

## 🗂️ Key Repo Structure

/src/
├── components/ → UI + Layout + Chat widgets
├── features/ → Calendar, News Feed, Academic Tools
├── lib/ → Supabase, Durham modules, AI agents
├── pages/ → Main route entrypoints
└── styles/ → Tailwind + global styling

/database-schema/ → SQL and migration logic
/public/ → Images, favicons, downloadable PDFs
/netlify/functions/ → Serverless API routes (e.g. chat, calendar)


---

## 📅 Calendar + Academic Flow

### 🧭 Year-at-a-Glance (YAAG)
- `/pages/year-at-a-glance/index.tsx` → Michaelmas, Epiphany, Easter columns
- Click into month → `/year-at-a-glance/month.tsx`
- Click into week/day → `/year-at-a-glance/week.tsx`
- All client-only with `next/dynamic`
- Calendar data: `/lib/hooks/useCalendarData.ts`, `/api/calendar/*`

### 📘 Module Mastery
- `/lib/durham/modules.ts` → 3-year core + optional modules
- Module prerequisites, credits, recommendations
- Auto-validation based on user level

### 🧭 Academic Calendar
- `/lib/durham/academicCalendar.ts` → term dates, holidays, exams
- Used for timeline syncing + nudges

---

## 🎓 Flagship Features (Planned + Partial)

- ✅ YAAG (Year-at-a-Glance full academic planner)
- ✅ Durham Law module validation + credit tracker
- ✅ Assignment Support with AI nudges
- ✅ UK Law News Feed (RSS + Durham news)
- 🔄 Premier Lounge (by year group, peer support)
- 🔄 Always With You (AWY) — floating online status widget
- 🔄 Voice Journaling + Legal Reflection Space
- 🔄 PhD-level exam prep, citation, and OSCOLA formatting AI
- 🔄 Legal Skills + Employability pathway assistant
- 🔄 AI-powered flashcards, study planner, wellbeing check-ins

---

## ⚠️ Durmah Integration Notice

All prior `Durmah` voice mode code has been:
- ❌ Removed from this repo (both frontend + backend)
- ✅ Moved to standalone widget (`Durmah-Legal-Buddy`) for future plug-and-play
- ✅ Will be integrated via floating widget (`DurmahWidget.tsx`) + voice endpoint
- ✅ Will inherit this repo’s intelligence: calendar, modules, user context

This ensures a clean, independent repo with no broken dependencies.

---

## 💻 Local Development

```bash
# 1. Setup
cp .env.example .env.local

# 2. Run dev server
npm install
npm run dev

# 3. Type check / lint
npm run type-check
npm run lint

Required .env.local Keys
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
VITE_SESSION_ENDPOINT= (optional, for voice mode only)

🤖 AI Agents (External)

These live outside this repo, but connect via API/UI:

Agent	Functionality	Connected Repo
Durmah	Voice buddy, transcript memory	Durmah-Legal-Buddy
LegalEagle	Exam prep, case law analysis	Embedded in Durmah
MemoryCoach	Journaling, wellbeing check-ins	Coming soon
📜 Git + Sync

This repo should always remain:

Clean of legacy Durmah/voice/PlayHT code

Ready to integrate via Claude/Gemini CLI

Committed with .md updates + changelog as needed

🔐 Security & Ethics

All Supabase RLS policies enforced

Sensitive data encrypted at rest

Academic Integrity Terms built into signup flow

Ethics page embedded in UI

No AI agent allowed to generate answers to full legal assignments without disclaimer + student prompt

✅ Claude / Gemini Guidelines
If you're Claude:

Use Sonnet by default, Opus not available in Claude Code

All commands must be file-aware and type-safe

Avoid hallucinating paths or breaking next build

If you're Gemini:

You may edit files directly in VS Code or use local GCP CLI

Use Claude handover .md as baseline logic

Respect Tailwind, React Query v5 Object API, Supabase structure

🔁 Final Notes

This is the clean skeleton of the app.

All major AI/Voice/Calendar/Module functionality will be re-plugged as standalone components — letting this repo remain stable and version-controlled with zero bloat.

All AI CLI agents (Claude, Gemini, Qwen, DeepAgent) should refer to this file before any action.

Let’s build the best student experience ever crafted.