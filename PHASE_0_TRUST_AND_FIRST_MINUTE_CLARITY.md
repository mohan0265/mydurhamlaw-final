# Phase 0 — Trust & First-Minute Clarity (P0)

Status: READY TO EXECUTE  
Priority: CRITICAL (before any feature expansion)

---

## Purpose

Phase 0 ensures that a first-time visitor or student:

1) Immediately understands what MyDurhamLaw **is** and **is not**  
2) Trusts the platform within the first screen  
3) Knows exactly **what to do next** after signing up  
4) Does NOT experience confusion, doubt, or “pilot / invite-only” uncertainty

This phase focuses ONLY on clarity, trust, and first-minute UX.
No new features. No refactors.

---

## Core Problems Identified (From Comet Audit)

1) Independence disclaimer appears too late (footer / FAQ)
2) Mixed signals:
   - “Start Free Trial”
   - “Request Access”
3) Post-login experience drops users straight into YAAG without guidance
4) No explicit “Start here” orientation after first login

---

## Phase 0 Scope (Strict)

### IN SCOPE
- Homepage messaging placement
- Pricing page clarity
- Signup flow copy
- First login landing guidance (lightweight, non-modal preferred)
- CTA wording consistency

### OUT OF SCOPE
- Feature logic
- Data models
- Widgets
- Exams / Assignments / Lectures behavior
- Visual redesign beyond copy/layout nudges

---

## Required Changes

### 1️⃣ Surface Independence & Integrity EARLY

Add a short, calm trust line **within the first screen** on:

- Homepage (near hero or just below primary headline)
- Signup page (before Google sign-in button)

**Approved wording (locked):**

> “MyDurhamLaw is an independent study companion designed around the Durham Law journey.  
> It is not affiliated with or endorsed by Durham University.”

Tone:
- Neutral
- Non-defensive
- Matter-of-fact

---

### 2️⃣ Eliminate Access Confusion

Unify student entry into **one clear path**:

- Primary CTA everywhere: **Start Free Trial**
- Remove or visually de-emphasize:
  - “Request Access” for students
- If “Request Access” is needed:
  - Restrict it to partners / institutions only
  - Clearly label it as **Not for students**

Students must never wonder:
> “Is this invite-only?”  
> “Will my access suddenly be revoked?”

---

### 3️⃣ Post-Login Orientation (“Where do I start?”)

After first successful login:

- Do NOT silently drop user into YAAG without context
- Add a lightweight orientation block at the top of the landing page

**Content requirements:**
- Headline: “Welcome — here’s how to start”
- 3 clear steps (example):
  1. Review your Year at a Glance
  2. Add your first assignment or lecture
  3. Use Durmah for planning or questions

**Important:**
- This is NOT a forced tour
- Must be dismissible
- Should not block usage

---

### 4️⃣ CTA Language Consistency

Ensure wording is consistent across:
- Homepage
- Pricing
- Header
- Signup

Allowed CTAs:
- Start Free Trial
- Sign In
- See Pricing

Avoid:
- Start Free (if ambiguous)
- Request Access (for students)

---

## Acceptance Criteria (Definition of Done)

Phase 0 is complete when:

1) A new visitor can answer in <10 seconds:
   - “Is this official Durham?” → **No**
   - “Is this safe to use?” → **Yes**
   - “Can I start now?” → **Yes**

2) A new student:
   - Signs up
   - Logs in
   - Immediately sees guidance on what to do next

3) No page presents conflicting access signals

---

## Manual Verification Checklist

### Logged-Out
- [ ] Homepage shows independence disclaimer within first screen
- [ ] Pricing page clearly shows free trial with no access ambiguity
- [ ] Signup page repeats independence disclaimer before Google sign-in

### Logged-In (First Login)
- [ ] User sees “Welcome / Start here” guidance
- [ ] Guidance is dismissible
- [ ] No forced tour or modal lock-in

---

## AG Execution Rules (MANDATORY)

When implementing Phase 0:

AG must output:
1) List of files changed
2) Exact copy added/modified
3) Where each change appears in the UI
4) Step-by-step manual verification instructions

AG must NOT:
- Claim deployment unless explicitly verified
- Combine Phase 0 with later phases
- Add new features or flows

---

## Why Phase 0 Matters

If Phase 0 is weak:
- Students hesitate
- Trust erodes
- Even great features go unused

If Phase 0 is strong:
- Everything else feels obvious
- Students relax
- Conversion and retention rise naturally
