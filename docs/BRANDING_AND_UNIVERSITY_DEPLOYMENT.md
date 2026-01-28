# Branding & University Deployment Policy (LOCKED)

Last updated: 2026-01-28  
Owner: Caseway platform team

## 1) Purpose

This document defines the **non-negotiable rules** for:

- Caseway platform branding
- University-specific deployments (e.g., Durham Law)
- How we expand to new universities (Oxford, Cambridge, etc.) without reworking the entire product

This policy exists to:

- keep branding consistent,
- avoid accidental removal of university-specific academic context,
- maintain a clean, repeatable scaling model.

---

## 2) Definitions

### 2.1 Global Platform (ALWAYS)

**Caseway** is the global product/platform brand:

- product name
- logos and visual identity
- design system (colors, components, header)
- marketing pages that describe the platform generally
- the underlying AI tooling and UI framework

**Rule:** Caseway branding must be consistent across the entire app.

### 2.2 University Deployment (INSTANCE)

A **University Deployment** is a configured “instance” of Caseway for a specific university/program, e.g.:

- Durham University Law
- Oxford Law (future)
- Cambridge Law (future)

This includes:

- syllabus/module structure
- exam formats and marking styles
- assignment workflows
- terminology that is academically accurate for that university
- any “tailored for Durham law students” type messaging where it is true and context-specific

**Rule:** University references are allowed and necessary when describing real academic targeting and content.

---

## 3) What Must NEVER Be Removed

The app may target Durham students and refer to Durham contextually.

Do NOT remove:

- “Durham” references inside academic context, including:
  - module pages
  - exam prep pages
  - assignment pages
  - lecture/timetable workflows
  - Durham-specific guidance text
- “Tailored for Durham Law students” style statements **when they reflect real configuration and content**

**Rule:** Remove old logos/branding. **Do not erase academic targeting.**

---

## 4) What MUST Be Rebranded (Always)

The following must present as **Caseway**:

- platform name in headers/nav
- global UI identity
- logos and favicon set
- public-facing product identity
- generic platform descriptions

Examples:

- “MyDurhamLaw” as product name → should be replaced with **Caseway**
- old courthouse/scale logos → replaced with **Caseway logo + dot mark favicon**

---

## 5) Asset Source of Truth (LOCKED)

### 5.1 Primary Logos (SVG)

- `public/brand/caseway/caseway-logo.svg` (default)
- `public/brand/caseway/caseway-logo-dark.svg` (dark mode / white variant)

### 5.2 PNG Fallbacks

- `public/assets/images/brand/caseway-logo.png`
- `public/assets/images/brand/caseway-logo-white.png`

### 5.3 Favicons / PWA Icons (Root public)

- `public/favicon.ico`
- `public/favicon-16x16.png`
- `public/favicon-32x32.png`
- `public/apple-touch-icon.png`
- `public/android-chrome-192x192.png`
- `public/android-chrome-512x512.png`
- `public/site.webmanifest`

**Rule:** Do not regenerate these unless we explicitly decide to rebrand again.

---

## 6) Scaling Model for New Universities (Future-Proof Plan)

### 6.1 Core Idea

Caseway stays constant.  
Only the **University Deployment Layer** changes.

### 6.2 Recommended Structure

We will progressively move university-specific content/config into a dedicated structure such as:

- `data/universities/durham-law/...`
- `data/universities/oxford-law/...` (future)
- `data/universities/cambridge-law/...` (future)

Each university folder should contain:

- module catalog
- term dates
- exam formats
- assessment rules and templates
- university-specific content references (not global brand assets)

### 6.3 “Switching Universities”

Long-term, the app should support a single “active university” selection:

- per user profile, or
- per deployment environment variable, or
- per subdomain (future)

**Rule:** We do not fork the entire app per university. We configure it.

---

## 7) Developer / Agent Rules (AG / Automation Safe Zone)

### Allowed changes

- Replace legacy logos and old branding assets
- Update header/logo placement
- Update color tokens and theme styling
- Update favicon assets (only if instructed)
- Improve layout spacing/typography without changing meaning

### Forbidden changes

- Removing Durham academic references
- Rewriting academic meaning to be “generic”
- Deleting module/exam/assignment Durham language that is content-true
- Adding any text implying official affiliation with Durham University

---

## 8) Compliance Summary

We are:

- **Caseway** as the platform brand
- **Durham Law** as a targeted deployment and academic configuration

We must avoid:

- any wording that implies official endorsement/ownership by Durham University

We may use:

- “built for the Durham Law journey”
- “tailored for Durham law students”
- “Durham-specific syllabus and exam support”
  when accurate and context-specific.

(End of locked policy.)
