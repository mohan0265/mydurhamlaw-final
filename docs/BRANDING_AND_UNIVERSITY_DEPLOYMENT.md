# Caseway Branding & University Deployment Guide

## Core Concept

**Caseway** is the global legal education platform product.
**Durham Law** (and others) are specific **deployment instances** or **configurations**.

### Terminology Rules

| Concept           | Term                   | Usage Rule                                                                                       |
| :---------------- | :--------------------- | :----------------------------------------------------------------------------------------------- |
| **Product Name**  | **Caseway**            | Use for the platform, app, and service. "Powered by Caseway".                                    |
| **Instance Name** | **Durham Law Edition** | Use when referring to the specific curriculum/university support.                                |
| **University**    | **Durham University**  | Reference _only_ in descriptive context (syllabus, exams). **NEVER** imply official affiliation. |

### DOs and DON'Ts

#### ✅ DO

- Keep "Durham Law" references in syllabus, exam prep, and assignment context.
- Use "Caseway" for the dashboard, login, and global branding.
- Use the **Teal/Gold** color palette for the Caseway brand.
- State "Aligned to Durham Law modules" (Descriptive).

#### ❌ DO NOT

- Remove "Durham" references from academic content.
- Use "MyDurhamLaw" as the product name (Legacy).
- Use the "Courthouse" or "Scales" legacy logos.
- State "Official Durham University App" (Liability).

### Adding New Universities (e.g., Oxford/Cambridge)

To deploy for a new university:

1.  **Config**: Create a new configuration profile (like `src/lib/durham-config.ts`).
2.  **Content**: Map modules and syllabus to the new university.
3.  **Branding**: Keep "Caseway" as the shell. Update the _Instance Name_ to "Oxford Law Edition" etc.
4.  **Deployment**: Use environment variables to switch the active instance configuration.

### Brand Assets

- **Primary Logo**: `public/brand/caseway/caseway-logo.svg`
- **Dark Mode**: `public/brand/caseway/caseway-logo-dark.svg`
- **Favicons**: Standard set in `public/` (Do not move).
