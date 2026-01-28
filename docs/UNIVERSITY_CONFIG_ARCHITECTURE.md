# University Config Architecture (Caseway)

## Purpose

Caseway is the **global product shell**.
Each university is a **deployment instance** powered by a configuration profile + content pack.

This document defines the **one-time architecture** so that:

- Durham stays fully supported and explicitly referenced in academic contexts
- future rollouts (Oxford/Cambridge/etc.) become “add a config + add content”, not a rebrand project
- branding remains Caseway, while academic tailoring remains university-specific

---

## Non-Negotiables (Locked Rules)

1. **Caseway is always the product name**

- App name, UI chrome (nav, dashboard shell), docs, product voice = “Caseway”
- “Durham Law Edition” is an **instance label**, not a product name.

2. **Durham references must remain in academic surfaces**

- Syllabus, exams, assignments, lecture tools, module pages may and should say “Durham”.
- This is descriptive curriculum targeting, not affiliation.

3. **Never imply official affiliation**
   Prohibited phrases:

- “Official Durham University app”
- “Partnered with Durham University”
  Allowed:
- “Aligned to Durham Law modules”
- “Built for Durham Law students”
- “Durham Law Edition (Caseway instance)”

4. **No global search/replace on university names**
   All university switching must occur via config + content packs.

---

## Instance Model

### Terminology

- **Product**: Caseway
- **Instance**: “Durham Law Edition”, “Oxford Law Edition”
- **University Key**: `durham`, `oxford`, `cambridge`, etc.

### What an instance controls

- Display labels (instance name, descriptive text)
- Curriculum scope (modules, assessments, exam patterns)
- Default content sources (md files, datasets)
- Feature flags (enable/disable certain pages per university)
- Links (Blackboard equivalents, library links, portal URLs)
- SEO metadata (instance-aware but product-branded)

---

## Target Folder Structure

### 1) Config profiles (code)

Create (or standardize to) this folder:

src/lib/university/
types.ts
index.ts
instances/
durham.ts
oxford.ts
cambridge.ts

- `types.ts` defines `UniversityConfig` interface
- each instance file exports a strongly typed config object
- `index.ts` resolves the active instance

### 2) Content packs (content/data)

Keep content separate from UI:

data/universities/
durham/
modules.json
assessments.json
readinglists.json
calendar/
policies/
copy/
oxford/
cambridge/

If you already store module content elsewhere, keep this as the canonical target layout going forward.

### 3) Brand assets (static)

Brand assets stay in `public/brand/caseway/` and do not vary by university unless explicitly required.

---

## Config Interface (Conceptual)

A config must include:

- `key`: `"durham"`
- `instanceName`: `"Durham Law Edition"`
- `universityDisplayName`: `"Durham University"`
- `legalDisclaimers`: short safe wording for footer/about
- `theme`: tokens for instance accents (optional; keep Caseway base)
- `contentPaths`: pointers to `data/universities/<key>/...`
- `featureFlags`: toggles (e.g., enable LNAT features only for certain tracks)
- `externalLinks`: portal, library, timetable/blackboard links
- `seo`: title templates, OG defaults, index/noindex controls for private pages

---

## Active Instance Selection (Runtime)

### Required environment variable

Use exactly one of these patterns:

**Option A (preferred):**

- `NEXT_PUBLIC_UNIVERSITY_KEY=durham`

**Option B (fallback):**

- `NEXT_PUBLIC_INSTANCE=durham`

Rules:

- Default to `durham` if missing (safe for current production)
- Never hardcode Durham in UI logic; only in the config + content packs

---

## Resolution Strategy (How code finds the instance)

In `src/lib/university/index.ts`:

1. read `NEXT_PUBLIC_UNIVERSITY_KEY`
2. resolve to the matching config object
3. expose a single function: `getUniversityConfig()`
4. cache it (module-level) so it doesn’t re-resolve constantly

Everything else in the app imports config only through:

- `getUniversityConfig()`
  or
- a React context provider `UniversityProvider`

---

## Where University Awareness Appears (Allowed Zones)

### Allowed (and encouraged)

- module pages
- lecture pages
- assignment pages
- exam prep pages
- any syllabus-driven guidance text
- the “Instance label” in header/footer: “Durham Law Edition”

### Avoid (keep product-first)

- login/register UI should say “Caseway”
- billing/pricing should say “Caseway”
- account settings should say “Caseway”
- global navigation brand should say “Caseway”

---

## Minimal UI Wiring Plan

### 1) Add a provider (optional but clean)

Create:
src/components/providers/UniversityProvider.tsx

- reads config once
- exposes `useUniversity()` hook

### 2) Header branding

Header should render:

- Left: Caseway logo
- Small text under/near it: instance label (e.g., “Durham Law Edition”)

### 3) Academic page headers

Academic pages may show:

- “Aligned to Durham Law modules”
  pulled from config (so Oxford can swap without code edits)

---

## Data Model Guidance (Supabase)

Goal: keep shared tables global, and university-specific data scoped.

### Recommended pattern

Add a `university_key` column to any table that stores academic content:

- modules
- lectures
- assignments templates
- exam workspaces
- reading lists

Example:

- `university_key TEXT NOT NULL DEFAULT 'durham'`

RLS:

- users can only see rows matching their assigned university key
- admin tools can override if needed

### User profile

Store on user record:

- `university_key` (default `durham`)
- `program_track` (foundation / year1 / year2 / year3)
- optional: `course_variant` if multiple law pathways exist

---

## Rollout Process for a New University (Repeatable)

To add Oxford:

1. Create `src/lib/university/instances/oxford.ts`
2. Add `data/universities/oxford/*` content pack
3. Ensure DB rows for Oxford use `university_key='oxford'`
4. Deploy with:
   - `NEXT_PUBLIC_UNIVERSITY_KEY=oxford`
5. QA checklist:
   - header shows “Oxford Law Edition”
   - academic pages reference Oxford correctly
   - no “Durham” appears except in Durham instance

---

## Guardrails for Agents (AG / Gemini / Claude)

Agents must obey:

- Do not remove university references from academic content.
- Do not replace “Durham” globally.
- All changes must preserve:
  - Caseway product branding
  - instance-aware academic tailoring
- If adding a new university, add a config + content pack; do not rebrand the whole app.

---

## Appendix: Safe Footer Disclaimer Template

Use one of these (instance-configurable):

- “Caseway is an independent study platform aligned to the Durham Law curriculum. Not affiliated with or endorsed by Durham University.”
- “Caseway provides syllabus-aligned tools for Durham Law students. Not an official university service.”

(Keep short; place in footer/about, not in every page.)
