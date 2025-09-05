💕 Always With You (AWY) Widget — PQ Final Integration Prompt

Repository: https://github.com/mohan0265/mydurhamlaw-final
Branch: main (commit directly, no PRs).
Deployment: Netlify.
Database: Supabase (SQL + RLS already applied, including security_invoker=true fix).

✅ Current Status

awy_presence, awy_connections, awy_events tables + policies: done.

awy_visible_presence view recreated with security_invoker=true.

Env vars set on Netlify (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_FEATURE_AWY=1).

Files already added:

src/hooks/useAwyPresence.ts

src/components/awy/AWYWidget.tsx

src/pages/settings/awy.tsx

_app.tsx patched to mount AWY globally.

🎯 PQ Tasks
1. Verify & Refactor Integration

Confirm all imports resolve with repo path aliases (@/hooks/..., @/components/...). Fix any alias issues.

Ensure AWYWidget does not crash on login/logout transitions.

Wrap any Supabase RPC or query errors with safe try/catch logging.

2. Styling & UI Polish

Make widget draggable (persist last position to localStorage).

Ensure widget layers correctly with Durmah (z-index: AWY below Durmah).

Add smooth fade-in/out animations for avatars and menus (Tailwind + framer-motion if available).

3. Settings Page Enhancements

Replace localStorage for call_url with a persisted field:

If user profile jsonb already exists in DB, store under profile.settings.awy.call_url[loved_one_id].

If not, create a small new table awy_call_links (id, owner_id, loved_one_id, url, updated_at).

UI: show ✅ when saved successfully.

4. Notifications

Add toast notification for:

When a loved one comes online (presence insert/update).

When a wave is received.

Reuse existing react-hot-toast Toaster (already in _app.tsx).

5. QA / Acceptance

Multi-browser test: user A waves user B → B gets toast within 2s.

Presence auto-refresh: close tab A → within 2 minutes, A’s avatar fades to grey for B.

On Netlify Preview build, confirm widget only renders when NEXT_PUBLIC_FEATURE_AWY=1.

Accessibility: avatars + buttons keyboard-focusable, aria-labels present.

6. Documentation

Add docs/awy.md:

Purpose & philosophy (emotional anchor, “presence not chat”).

Env vars required.

How to add loved ones (connections table).

QA checklist.

Update README with a short AWY section + screenshot.

🚀 Deliverables

Fully functional AWY widget on Netlify build.

Settings page persists call_url in DB, not just localStorage.

Toast notifications for waves + presence changes.

Widget draggable + polished styling.

docs/awy.md and updated README.

🔒 Guardrails

Do not modify RLS or DB schema beyond optional awy_call_links table.

Do not commit secrets (service keys).

Keep all AWY feature flags behind NEXT_PUBLIC_FEATURE_AWY.

📌 Why this matters

AWY is not a chat app. It is the emotional heart of MyDurhamLaw: a floating reassurance that loved ones are “with you, always.” Every green dot is a reminder: “I am not alone.”
