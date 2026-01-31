# Upload Robustness QA Checklist

This document outlines the test cases and validation results for the **Student Mistake-Proof Upload Backbone**.

## 1. Lecture Upload Protection

| Test Case               | Interaction                                        | Expected Result                                                                          | Status  |
| :---------------------- | :------------------------------------------------- | :--------------------------------------------------------------------------------------- | :------ |
| **URL Displacement**    | Paste a Panopto URL into the Transcript field.     | Intervention Banner appears: "Oops! That looks like a Panopto link."                     | ✅ Pass |
| **Title Normalization** | Enter "CONTRACT LAW WEEK 1.pdf" as title and blur. | Title normalized to "Contract law week 1".                                               | ✅ Pass |
| **Draft Recovery**      | Fill partially, close modal, and reopen.           | Draft content (title, transcript) restored from localStorage.                            | ✅ Pass |
| **Undo Deletion**       | Delete a lecture from the list view.               | "Lecture deleted" toast appears with an "UNDO" button. Clicking it restores the lecture. | ✅ Pass |

## 2. Assignment Upload Protection

| Test Case          | Interaction                                     | Expected Result                                                            | Status  |
| :----------------- | :---------------------------------------------- | :------------------------------------------------------------------------- | :------ |
| **Date Sanity**    | Set due date to 01/01/2027.                     | Intervention Banner appears: "New Year's Day might be a placeholder date." | ✅ Pass |
| **Past Date**      | Set due date to one year ago.                   | Intervention Banner warns about date being in the past.                    | ✅ Pass |
| **Draft Recovery** | Fill form, refresh page, open "New Assignment". | Data restored. QuickActions widget shows a red indicator dot.              | ✅ Pass |
| **Undo Deletion**  | Delete assignment from detail view.             | Toast with "UNDO" restores the record to Supabase.                         | ✅ Pass |

## 3. Server-Side Integrity

| Test Case             | Action                                                | Result                                       | Status  |
| :-------------------- | :---------------------------------------------------- | :------------------------------------------- | :------ |
| **API Normalization** | Send lowercase/messy title to `/api/lectures/create`. | Record created with normalized casing.       | ✅ Pass |
| **API Validation**    | Send empty title to `/api/lectures/create`.           | Returns 400 "Title is too short or invalid". | ✅ Pass |

---

_Verified by Antigravity on 2026-01-31_
