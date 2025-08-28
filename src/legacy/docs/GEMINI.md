# Project: MyDurhamLaw (Next.js 14 on Netlify)

## How to help (Gemini Code)
- Make **direct edits** to files (no full-file dumps unless asked).
- Keep changes **small, typed, and commented**; never break `next build`.
- Respect path aliases (`@/lib/...`, `@/features/...`).
- If you change types/APIs, **migrate all callers** and fix type errors.

## Tech
- Next.js 14 (classic `pages/`, not App Router)
- TypeScript + Tailwind
- **@tanstack/react-query v5** (use the **object** API)
- Supabase Auth
- Netlify (no `output: 'export'`)

## Repo map (just the bits you’ll touch)
- `src/layout/LayoutShell.tsx` (global layout)
- `src/pages/_app.tsx` (QueryClientProvider + HydrationBoundary)
- Calendar:
  - `src/features/calendar/MonthPageClient.tsx`
  - `src/features/calendar/WeekPageClient.tsx`
  - `src/pages/year-at-a-glance/{index,month,week}.tsx` (must be **client-only** via `next/dynamic`)
  - `src/lib/hooks/useCalendarData.ts` (React Query hooks)
  - `src/pages/api/calendar/*` (serverless routes)
- Dashboard: `src/pages/dashboard/index.tsx`
- Community: `src/pages/community-network/index.tsx` (or similar)

## Non-negotiables
- **React Query v5 object API only**
  ```ts
  // ✅ correct (v5)
  useQuery({
    queryKey: ['key', vars],
    queryFn: async () => { /* ... */ },
    enabled: true,
    staleTime: 60_000,
    gcTime: 300_000
  })
