# Spec: AWY Widget Stabilization & Placement

## Objective
Ensure the Always With You (AWY) presence widget renders client-side only, floats at bottom-right above the Durmah mic (safeRight=88, safeBottom=180), persists position during session, and exposes a minimal presence API.

## In-Scope
- Dynamic import + hydration guards (client-only).
- Default position: bottom-right, 88px from right, 180px from bottom.
- Status ring: `online` (green), `busy` (amber), `offline` (gray, 60%).
- Drag-to-move within session (persist in memory, not DB).
- Feature flag: `NEXT_PUBLIC_FEATURE_AWY="1"`.

## Acceptance Tests
- AT1: With flag=0, widget does not render.
- AT2: With flag=1, widget appears after hydration (no SSR).
- AT3: Dragging >20px updates on-screen position and persists across route changes.
- AT4: Ring color maps correctly to `online|busy|offline`.
- AT5: No hydration mismatch warnings in console.
- AT6: On mobile (≤768px), no overlap with Durmah mic; mic remains clickable.

## Non-Goals
- Presence server, Supabase sync, push notifications.

## Tech Notes
- Next.js + Tailwind; keep logic in `src/components/awy/AWYWidget.tsx` and `src/components/AWYBootstrap.tsx`.
- Type-safe props; no external state manager.
