CLAUDE.md — MyDurhamLaw: YAAG + Durmah Integration Plan

Stack
Next.js 14 (pages/), TypeScript, Tailwind, @tanstack/react-query@^5, Supabase Auth + DB, Netlify.

Repo anchors

App shell: src/pages/_app.tsx, src/layout/LayoutShell.tsx

Hooks: src/lib/hooks/useCalendarData.ts

YAAG pages: src/pages/year-at-a-glance/{index.tsx,month.tsx,week.tsx}

Calendar components: src/components/calendar/*

Durham data: src/data/durham/llb

Supabase bridge & auth: src/lib/supabase/* (includes supabaseBridge.ts, AuthContext.tsx)

Planner (legacy): src/pages/planner/** (to be rationalized)

Mission Objectives (P0)

Single source of truth for term windows & modules
YAAG must read dates/modules from src/data/durham/llb/academic_year_2025_26.ts and never show events outside those term windows (e.g., August/September during vacation).

Year View shows the entire year
Three vertical columns (Michaelmas/Epiphany/Easter) populated from the Durham plan, plus upcoming items (filtered to term windows), and progress.

Month/Week route sanitation
If current date lies outside teaching weeks, default Month/Week pages to the first active teaching period (e.g., October 2025 for 2025/26). Always filter events to academic-year range and term windows.

Durmah integration knows the user
Pass studentContext (university, programme, year group, academic year, module list) from AuthContext/Durham plan to DurmahWidget via supabaseBridge.ts. No “who are you?” prompts.

Student edits (“Contribute”)
A /tools/contribute page that writes to Supabase with a big, explicit confirmation, and merges student-provided topics into Month/Week views (tagged as “Student-provided”).

Clean duplicates & legacy routes
Keep exactly one set of YAAG pages; preserve planner deep links only if they’re useful. Delete or quarantine unused copies to make builds deterministic.

Acceptance Criteria

Year View renders 3 columns with modules + filtered upcoming events, driven by academic_year_2025_26.ts.

Month View: default to October 2025 when in vacation; shows 0 “lectures” for Aug/Sep; personal events still visible but outside-term flagged as “vacation”.

Week View: defaults to first teaching week when in vacation; shows merged schedule (official + student-provided) and tags student items.

DurmahWidget receives window.__mdlStudentContext = { userId, university:'Durham', programme:'LLB', yearGroup:'year1|year2|...', academicYear:'2025/26', modules:[...] } at mount time.

Contribute saves to Supabase (student_topics or similar) only after a checkbox confirmation that warns “this updates your planner everywhere”.

Netlify build succeeds (npm run build OK).

Source of Truth & Data Flow

Term windows & modules → src/data/durham/llb/academic_year_2025_26.ts

Events (priority):

(a) official timetable events (if you have a table like events)

(b) assessments derived from plan.assessments

(c) user personal_items

(d) student_topics (from Contribute) → only for Month/Week detail lists

Filters

Always drop events with start_at outside plan.termDates.{michaelmas,epiphany,easter} for Year View

Month/Week routes: clamp target month/week to academic-year and term windows (or pick next teaching week)

Timezone: use Europe/London consistently for comparisons.

File Workplan (exact paths)
A) Year View (P0 – in place now)

Keep the new src/components/calendar/SemesterColumn.tsx (already added).

Replace src/components/calendar/YearView.tsx with the version that:

Reads the plan by year (DURHAM_LLB_2025_26[yearKey])

Splits modules by delivery (“Michaelmas”, “Epiphany”, “Michaelmas+Epiphany”)

Filters yearOverview.events by term windows

✅ If this is already in your repo from a previous step, leave as is.

B) Month Page (P0)

Edit (or replace) src/pages/year-at-a-glance/month.tsx:

Default month if in vacation:

Compute termDates from DURHAM_LLB_2025_26[yearKey]

If today < michaelmas.start or > easter.end, set current calendar month to October 2025

useMonthData(year, month) should fetch then post-filter events into [academicYear.start, academicYear.end]

“Quick stats” should count within-term items only

C) Week Page (P0)

Edit (or replace) src/pages/year-at-a-glance/week.tsx:

On load, if selected date falls outside any teaching week, jump to the first teaching week (michaelmas.weeks[0])

Fetch week data and merge student topics (from Supabase) into the day lists with a small “Student-provided” chip

D) Hook: useCalendarData.ts (P0)

Edit src/lib/hooks/useCalendarData.ts:

Replace hardcoded termDates inside useAcademicCalendar with values from plan:

Find user’s yearKey (foundation/year1/year2/year3) via profile → getDefaultPlanByStudentYear

Use plan.termDates.{michaelmas,epiphany,easter} to compute currentTerm, isInTerm, and getTermProgress

All fetchers (/api/calendar/year|month|week|day) should filter by academic-year when returning data (or filter after fetch in the hook—choose one place and be consistent).

E) Contribute Page (P0)

New/Replace: src/pages/tools/contribute.tsx

Full Supabase form including:

Checkbox “I confirm this will update my planner everywhere”

Fields: term (enum), week (1..10), module_code (string), day (Mon–Fri), title, notes (optional), location (optional), start_time (optional), end_time (optional)

On submit → upsert into student_topics with user_id

Show a success toast; list last 5 contributed items below.

DB expectation (Claude: create if missing, SQL example for reference—DO NOT run here):

table student_topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  academic_year text not null default '2025/26',
  year_key text not null, -- foundation|year1|year2|year3
  term text not null,     -- michaelmas|epiphany|easter
  week int not null,
  module_code text,
  day text,               -- Mon|Tue|Wed|Thu|Fri
  title text,
  notes text,
  location text,
  start_time text,
  end_time text,
  created_at timestamptz default now()
)

F) Durmah Integration (P0)

Edit src/lib/supabase/supabaseBridge.ts + src/pages/_app.tsx:

At client mount, construct and attach:

// window scope
window.__mdlStudentContext = {
  userId: session?.user?.id || '',
  university: 'Durham University',
  programme: userProfile?.user_type || 'LLB',
  yearGroup: normalizedYearGroup, // 'foundation' | 'year1' | 'year2' | 'year3'
  academicYear: '2025/26',
  modules: currentPlan.modules.map(m => ({ code: m.code, title: m.title, credits: m.credits }))
};


Pass this object into DurmahWidget via prop or let widget read window.__mdlStudentContext on mount.

If no session, provide a minimal anonymous object (no writes).

G) Duplicate/Legacy Cleanup (P0)

KEEP

src/pages/year-at-a-glance/{index.tsx,month.tsx,week.tsx}

src/components/calendar/{YearView.tsx,MonthView.tsx,WeekView.tsx,DayDrawer.tsx,SemesterColumn.tsx,TimeBlock.tsx,ModuleGroup.tsx,TopicItem.tsx}

src/pages/planner/[year]/** only if you still want deep-linked planner. Otherwise, redirect to the new YAAG.

REMOVE/QUARANTINE (move to .backups/legacy-planner/)

src/components/planner/{Enhanced* , YearAtAGlanceView.tsx} (old versions)

src/pages/planner/year-at-a-glance.tsx

src/pages/planner/year-at-a-glance/** (index redirect + duplicates)

Any calendar duplicates in src/planner/* that are not used by routes

The internal helper note: src/features/calendar/GEMINI.md (was an assistant doc; move to .backups/)

Keep the DB-backed [year]/[term]/week/[n].tsx only if you require those URLs for sharing. Otherwise add a redirect to the new YAAG week page.

H) API guardrails (P1)

In /api/calendar/{year,month,week,day}.ts:

If query range is outside Durham academic-year, clamp to [michaelmas.start, easter.end].

Optionally, add ?kind=within-term to only return teaching-week items.

“Done” Checklist (for Claude to tick off)

 YearView columns show plan modules and filtered upcoming items

 Month default jumps to October 2025 during vacation; no fake August/Sept lectures

 Week default jumps to first teaching week; merges student_topics with badge

 DurmahWidget receives window.__mdlStudentContext and detects programme/year correctly

 /tools/contribute inserts into Supabase and reflects in Week/Month

 Old planner/duplicate calendar files moved to .backups/legacy-planner/

 npm run type-check and npm run build both succeed locally

 Netlify deploy → green

Commands (Claude can run in “Claude Code”)
# sanity
npm ci
npm run type-check

# build
npm run build

# if Netlify warns about swc, just run locally once to patch cache
npm run build

# optional: create backups folder for legacy pages
mkdir -p .backups/legacy-planner

Notes for Claude

Use React Query v5 object API only.

Preserve path aliases (@/lib/..., @/data/..., @/components/...).

Keep changes typed; don’t widen types unnecessarily.

If you touch any types in @/types/calendar, migrate all callers.

Avoid SSR breaks: YAAG pages can stay client-only via next/dynamic({ ssr:false }).

Timezone: assume Europe/London for comparisons/labels.

When unsure of DB tables, implement safe no-op guards (return empty arrays), but keep the UI stable.

Quick Pinned Snippets (Claude can reuse)

Get plan by user profile

import { getDefaultPlanByStudentYear } from '@/data/durham/llb'

const programme = userProfile?.user_type || 'LLB'
const userYearGroup = (userProfile?.year_group || 'year1').toLowerCase().replace(/\s/g, '') as 'foundation'|'year1'|'year2'|'year3'
const plan = getDefaultPlanByStudentYear(userYearGroup)


Filter events to a window

const within = (e: { start_at?: string }, startISO: string, endISO: string) => {
  if (!e?.start_at) return false
  const d = new Date(e.start_at).getTime()
  return d >= new Date(startISO).getTime() && d <= new Date(endISO).getTime()
}


Default to October 2025

const DEFAULT_MONTH = 10 // October
const DEFAULT_YEAR  = 2025

Escalations / Edge Cases

If Supabase returns 401 for month/week/day, show a signed-in required card and don’t crash.

If plan is missing (shouldn’t happen), show a friendly “plan unavailable” card and hide controls that depend on it.

If student submits Contribute without module_code, accept it but flag “(Unspecified module)” in the UI.

End of CLAUDE.md
### Data verification status

- Durham LLB 2025/26: ✅ Verified and implemented (Europe/London TZ)
- Commit: <fill-after-commit>
- Date: 2025-08-31
