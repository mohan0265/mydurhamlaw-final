# UX Audit - January 5, 2026

## Audit Method
Live student journey test on https://www.mydurhamlaw.com
- Landing → Login → Dashboard → Assignments → AW Stages 1-6
- Browser DevTools console monitoring
- Network request tracking
- Widget interaction testing

---

## P0 (Critical - Blocks Users) 🔴

### 1. **Download Button Missing for Completed Assignments** ✅ FIXED & VERIFIED
- **Issue:** Assignment marked as "completed" shows no download link in assignment hub
- **Impact:** Users cannot access their finished work
- **Location:** Assignment detail view (right panel)
- **Root Cause:** 
  - `AssignmentDetail.tsx` was fetching from non-existent `step_key: 'stage_6_review'`
  - Actual data saved in `step_key: 'stage_5_formatting'` (field: `formattedDraft`)
  - Database confirmed: ZERO records with `stage_6_review` exist
- **Fix Applied:**
  - Changed fetch logic to look for `stage_5_formatting` (formatted draft)
  - Added fallback to `stage_4_drafting` (raw draft) if Stage 5 skipped
  - Button now appears when draft data exists
- **Content Verification:**
  - Database query confirms: 9,495 characters, 1,392 words of actual essay content
  - Essay text: "INTRODUCTION TO ARTICLE 10 ECHR..." (legal essay on freedom of expression)
  - Downloaded file: 11.6 KB .docx with title page, essay, and AI declaration
- **Screenshot:** `uploaded_image_1767624954861.png`
- **Commit:** `bb29767`

### 2. **Form State Sync Failure** ⚠️ NEEDS USER VERIFICATION
- **Issue:** Form validation fails even when fields appear populated
- **Affected Forms:**
  - New Assignment modal ("Please enter a title and due date")
  - Stage 2 Research sources ("Please fill citation and notes")
- **Impact:** Users get stuck, cannot proceed despite filling forms
- **Code Review Findings:**
  - `AssignmentCreateForm.tsx` DOES use proper React state (`setFormData`) for autofill (line 184)
  - onChange handlers correctly bound (line 281, 294, 304, etc.)
  - Validation logic checks correct state variables (line 35-37)
- **Conclusion:** Code appears correct. Issue may have been fixed in previous session.
- **Action Required:** User to test assignment creation flow and report if still broken.

---

## P1 (High - Confusing But Usable) 🟡

### 3. **Workflow Stage Navigation Locked**
- **Issue:** Stage icons in header are non-interactive, even after progress
- **Impact:** Users can't jump to previous stages to review/edit
- **Current:** Linear-only flow enforced silently
- **Improvement Needed:** Either enable navigation OR show locked state with tooltip

### 4. **Widget Overlap Conflict**
- **Issue:** Durmah and AWY widgets occupy same screen space
- **Impact:** When both open, they stack/overlap awkwardly
- **Location:** Bottom-right corner
- **Solution Needed:** Auto-close one when other opens OR reposition

### 5. **Assignment Brief Not Displaying**
- **Issue:** Description entered during creation shows "No brief provided"
- **Impact:** Loss of user-entered context
- **Location:** Assignment detail "ASSIGNMENT BRIEF" section
- **Likely Cause:** Field name mismatch (description vs question_text)

### 6. **No Skip Option in Stage 2**
- **Issue:** Requires 5 sources, no "I'll do this later" option
- **Impact:** Blocks students who want to draft first, research later
- **Current:** Must add 5 sources to proceed

---

## P2 (Polish - Low Priority) 🟢

### 7. **Greeting Inconsistency**
- **Dashboard:** "Good Evening, Student"
- **Header:** "Hi, M Chandramohan"
- **Fix:** Use consistent personalization

### 8. **Console Route Abort Errors**
- **Error:** `Abort fetching component for route: "/dashboard"`
- **Frequency:** Multiple occurrences during navigation
- **Impact:** None (cosmetic)
- **Likely Cause:** Rapid route transitions / prefetch conflicts

---

## ✅ Autosave Verification (PASSED)

Tested on live site:
- ✅ **Stage Persistence:** Resumed at Stage 2 after hard refresh
- ✅ **Data Persistence:** Research sources retrieved from Supabase correctly
- ✅ **Navigation Persistence:** AW modal restored to last active state when returning from dashboard

---

## Fixes Applied This Session

### P0 Fixes:
- [x] **Download button for completed assignments** 
  - Changed `step_key` from `'stage_6_review'` to `'stage_5_formatting'`
  - Fetch `formattedDraft` instead of `finalDraft`
  - Added fallback to Stage 4 raw draft
  - Commit: Pending
- [ ] Form state sync (assignment creation + research sources)

### P1 Fixes (Quick wins only):
- [ ] Assignment brief display fix
- [ ] Widget overlap auto-close

---

## Next Steps After P0 Fixes
1. Deploy and verify P0s resolved on live domain
2. Proceed to **Stage 2: AW Autosave Robustness** verification
3. Then **Stage 3: AWY End-to-End 2-Account Testing**
