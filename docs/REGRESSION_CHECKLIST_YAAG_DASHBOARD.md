# MYDURHAMLAW REGRESSION CHECKLIST: YAAG ↔ DASHBOARD INTELLIGENCE

**Critical Contract**: The Dashboard "Next Best Action" MUST rely on real YAAG data.

## 1. Data Integrity & Priority
- [ ] **Create High Priority**: Create an assignment due in 4 days.
  - [ ] Verify Dashboard Banner shows it immediately as "Next Best Action".
- [ ] **Create Low Priority**: Create another assignment due in 10 days.
  - [ ] Verify it appears in the "Upcoming Deadlines" list, NOT the banner.
- [ ] **Exam Trump**: If an Exam is on the same day as an Assignment.
  - [ ] Verify Exam takes precedence in the banner (Score 300 vs 200).

## 2. Navigation & User Flow
- [ ] **Banner Link**: Click "View in YAAG" on the Dashboard banner.
  - [ ] Verify URL contains `#event-{id}`.
  - [ ] Verify successful navigation to the correct Day View.
  - [ ] Verify the page **auto-scrolls** to the specific event card.
  - [ ] Verify the **golden highlight flash** animation plays.

## 3. Inline Editing
- [ ] **Assignment Edit**: In YAAG Day View, click an assignment.
  - [ ] Verify `SimpleAssignmentEditModal` opens.
  - [ ] Change the date to +2 days.
  - [ ] Verify page refreshes and event *disappears* from current day (moves to new date).
- [ ] **Personal Item Edit**: Click a personal study block.
  - [ ] Verify `PersonalItemModal` opens.
- [ ] **Plan Override**: Click a university plan lecture.
  - [ ] Verify `PlanEventModal` opens (allows venue/tutor override).

## 4. Empty State
- [ ] **Clear Deck**: Ensure no deadlines exist for the next 14 days.
  - [ ] Verify Dashboard shows "You're on track" message.
  - [ ] Verify it does NOT show generic study advice.

## 5. Technical Safety
- [ ] **Bad ID Fallback**: Manually visit `/year-at-a-glance/day?y=year1&d=2026-01-01#event-INVALID`.
  - [ ] Verify page loads without crashing.
  - [ ] Verify console warning logged (no user-facing error).
