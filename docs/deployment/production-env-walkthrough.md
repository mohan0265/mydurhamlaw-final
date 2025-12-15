# Production Deployment & Environment Variables

## Overview
This document outlines the environment variables used in production on Netlify and the process for triggering deployments.

## Environment Variables
The following environment variables are configured in Netlify for the production site (`https://mydurhamlaw.com`).

**Source of Truth:** Netlify Environment Variables UI (Site settings > Environment variables).

### Core Configuration
- `NEXT_PUBLIC_APP_URL`: `https://mydurhamlaw.com`
- `NEXT_PUBLIC_APP_NAME`: `MyDurhamLaw AI Study App`
- `NODE_ENV`: `production`
- `NEXT_TELEMETRY_DISABLED`: `1`

### Supabase (Database & Auth)
- `NEXT_PUBLIC_SUPABASE_URL`: [Redacted]
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: [Redacted]
- `SUPABASE_SERVICE_ROLE_KEY`: [Redacted] (Used only in server-side functions)

### AI Services
- `GEMINI_API_KEY`: [Redacted] (Server-side)
- `NEXT_PUBLIC_GEMINI_API_KEY`: [Redacted] (Client-side usage allowed via `netlify.toml` allowlist)
- `OPENAI_API_KEY`: [Redacted]
- `ELEVENLABS_API_KEY`: [Redacted]
- `ELEVENLABS_VOICE_ID`: [Redacted]
- `ELEVENLABS_MODEL`: `eleven_turbo_v2`

### Payments (Stripe)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: [Redacted]
- `STRIPE_SECRET_KEY`: [Redacted]
- `STRIPE_WEBHOOK_SECRET`: [Redacted]
- `NEXT_PUBLIC_STRIPE_PRICE_ID`: [Redacted]

### Feature Flags
- `NEXT_PUBLIC_ENABLE_AI_FEATURES`: `true` (or as configured)
- `NEXT_PUBLIC_ENABLE_VOICE_FEATURES`: `true`
- `NEXT_PUBLIC_ENABLE_PODCAST_FEATURES`: `true`
- `NEXT_PUBLIC_ENABLE_WELLBEING_FEATURES`: `true`
- `NEXT_PUBLIC_FEATURE_AWY`: `true`
- `NEXT_PUBLIC_AWY_UI_MODE`: `full`
- `NEXT_PUBLIC_AWY_API_BASE`: `/api`

## Deployment Process

### 1. Automatic Deploys
Pushing to the `main` branch on GitHub automatically triggers a new deployment on Netlify.

```bash
git push origin main
```

### 2. Manual Deploys (Clear Cache)
If you need to clear the build cache (e.g., after changing dependencies or environment variables):
1.  Go to [Netlify Deploys](https://app.netlify.com/sites/mydurhamlaw-final/deploys).
2.  Click **"Trigger deploy"**.
3.  Select **"Clear cache and deploy site"**.

## Troubleshooting "Exposed Secrets"
If a build fails with "Exposed secrets detected":
1.  **Check `netlify.toml`**: Ensure any necessary public keys (like `NEXT_PUBLIC_GEMINI_API_KEY`) are listed in `SECRETS_SCAN_OMIT_KEYS`.
2.  **Check Client-Side Imports**: Ensure no server-side files (like `src/lib/supabase/server.ts`) are imported into client-side components. Use `src/lib/billing/subscriptionServiceServer.ts` for server-side logic.
