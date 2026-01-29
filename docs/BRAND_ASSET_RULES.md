# Caseway Brand Asset Rules

## 1. Terminology

- **Correct**: Caseway, Caseway Law, Caseway AI
- **Forbidden**: MyDurhamLaw, mydurhamlaw.com
- **Exception**: Historical database migrations or legacy fallback config (only if strictly necessary).

## 2. Domain & URLs

- **Canonical Domain**: `casewaylaw.ai`
- **Legacy Domain**: `mydurhamlaw.com` (Must be redirected or replaced)
- **Local Test**: `@test.caseway.local` (NOT `@test.mydurhamlaw.local`)

## 3. Image Assets

- **Location**: `/public/brand/caseway/` or `/public/images/`
- **Forbidden**: `/public/demo-frames` containing old branding.
- **Placeholders**: Use neutral, vibrant gradients or abstract legal symbols if screenshots are unavailable.
- **Avatars**: Use `durmah_barrister.png` for Durmah.

## 4. CI/CD Enforcements

- **`npm run brand:guard`**: Scans for prohibited strings in source code.
- **`npm run assets:audit`**: Scans for broken image references and legacy asset usage.

## 5. UI Colors

- **Primary**: Violet/Purple (`purple-600`, `violet-600`)
- **Accent**: Emerald/Teal (Success), Rose (Care/Wellbeing)
- **Neutral**: Slate (Text)
