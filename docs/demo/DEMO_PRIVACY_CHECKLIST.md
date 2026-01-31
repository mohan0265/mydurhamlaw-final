# Demo Privacy Safety Checklist

**CRITICAL**: Every time a demo feature is modified, verify these points to prevent Personal Identifiable Information (PII) leakage.

## Global Checks

- [ ] **Demo Flag**: Verify `?demo=1` or `NEXT_PUBLIC_DEMO_MODE=true` is active.
- [ ] **Auth Bypass**: Ensure demo content does not trigger Supabase auth login/redirects.
- [ ] **No Live Data**: Ensure network tab shows NO requests to user-specific API endpoints (e.g. `/api/profile`, `/api/tasks`).

## Identity Protection

- [ ] **Name Masking**: User must be displayed as "Student" or "Demo Student".
- [ ] **Email Masking**: No email should be visible in header/sidebar.
- [ ] **Avatar**: Must utilize the generic "S" or "Student" icon, not a user profile picture.

## Asset Verification

- [ ] **Mock Data**: Verify all dates, deadlines, and module names are generic/mocked.
- [ ] **Screenshots/Videos**: Check all static assets in `/public/images/landing` for PII.

## Automated Test

- [ ] Run `npx playwright test tests/demo-privacy.spec.ts` to scan for forbidden strings (real names, real emails).
