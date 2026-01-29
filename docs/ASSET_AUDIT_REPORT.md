# Asset Audit Report

## Phase 0: Baseline Findings

### 1. Legacy Terminology ("MyDurhamLaw")

A grep search revealed widespread usage of "MyDurhamLaw" in the codebase, particularly in:

- `src/pages/admin/` (Titles, email logic)
- `src/pages/articles/` (Content text)
- `src/pages/api/` (User agents, email templates, canonical URLs)
- `src/pages/about.tsx` (Copy)
- `src/content/articlesIndex.ts` (Canonical URLs)
- `src/components/calendar/DurhamStyleEventCard.tsx` (Comments)

### 2. Demo Frames

- `public/demo-frames` directory exists.
- Search for "demo-frames" in `src` returned 0 results, implying these might be unused or referenced dynamically/confusingly.

## Phase 1: Broken Asset References

_To be populated by `scripts/audit-public-assets.mjs`_

## Phase 2: Replacements Log

_To be populated as replacements are made_
