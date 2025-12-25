# MyDurhamLaw Support / Admin Runbook

## Environment variables
Set these in Netlify:

### Frontend (Build) – PUBLIC
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

### Functions (Server) – PRIVATE
- `SUPABASE_URL` (same as public URL)
- `SUPABASE_SERVICE_ROLE_KEY` (server only; **never** in build)
- `ADMIN_USERNAME`, `ADMIN_PASSWORD` (admin_session)
- `OPENAI_API_KEY` (support AI reply)
- `RESEND_API_KEY`, `EMAIL_FROM` (optional escalation)
- `SUPPORT_ESCALATION_EMAIL` (optional, falls back to EMAIL_FROM)
- `SUPPORT_ALLOWED_ORIGINS` (comma-separated origins for support-create-ticket CORS)

Other existing app vars (Stripe, etc.) remain unchanged.

## Smoke tests (post-deploy)
1) Visitor: go to `/support`, enter name/email, send message → AI reply; refresh → thread persists (visitor_token).
2) Logged-in user: use support widget on dashboard → ticket created with user_id; thread loads.
3) Admin: /admin/login → /admin/support list; open ticket detail; update status/priority; send admin reply; add note.
4) KB: /admin/support/kb list and save article.

Expected failures:
- Visitor without visitor_token cannot read/post a ticket.
- Logged-in user cannot access another user’s ticket.

## Common failure modes
- 401 on support APIs: missing visitor_token or admin_session cookie.
- 403/CORS: add domain to `SUPPORT_ALLOWED_ORIGINS`.
- Service key leak risk: ensure `SUPABASE_SERVICE_ROLE_KEY` is **not** set in build env; guard-env.js will fail build if present.
- Admin_session missing: log in via /admin/login.

## Notes
- Support tickets store visitor_token in `support_tickets.client_meta`.
- AI replies never expose secrets; low confidence sets status “pending”.
- Escalation emails only send if RESEND/EMAIL_FROM configured; otherwise logged to console.
