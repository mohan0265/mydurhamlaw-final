import {
  AcademicYearPlan,
  DURHAM_LLB_2025_26_FOUNDATION,
  DURHAM_LLB_2025_26_Y1,
  DURHAM_LLB_2025_26_Y2,
  DURHAM_LLB_2025_26_Y3
} from "./academic_year_2025_26";

// Export types so the app can import from here
export type { AcademicYearPlan } from "./academic_year_2025_26";

// Map used by your Year-at-a-Glance to default and navigate
export const DURHAM_LLB_2025_26: Record<
  "foundation" | "year1" | "year2" | "year3",
  AcademicYearPlan
> = {
  foundation: DURHAM_LLB_2025_26_FOUNDATION,
  year1: DURHAM_LLB_2025_26_Y1,
  year2: DURHAM_LLB_2025_26_Y2,
  year3: DURHAM_LLB_2025_26_Y3
};

// Helper to pick default plan by student year
export function getDefaultPlanByStudentYear(
  studentYear: "foundation" | "year1" | "year2" | "year3"
): AcademicYearPlan {
  return DURHAM_LLB_2025_26[studentYear];
}

// Helpers for left/right arrows
const ORDER: Array<keyof typeof DURHAM_LLB_2025_26> = [
  "foundation",
  "year1",
  "year2",
  "year3"
];

export function getPrevYearKey(
  current: keyof typeof DURHAM_LLB_2025_26
): keyof typeof DURHAM_LLB_2025_26 {
  const i = ORDER.indexOf(current);
  return i > 0 ? ORDER[i - 1]! : ORDER[0]!;
}

export function getNextYearKey(
  current: keyof typeof DURHAM_LLB_2025_26
): keyof typeof DURHAM_LLB_2025_26 {
  const i = ORDER.indexOf(current);
  return i < ORDER.length - 1 ? ORDER[i + 1]! : ORDER[ORDER.length - 1]!;
}
