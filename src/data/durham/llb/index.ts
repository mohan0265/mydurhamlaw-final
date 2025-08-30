// src/data/durham/llb/index.ts

import type {
  AcademicYearPlan,
  ModulePlan,
  Assessment,
  TermBlock,
} from "./academic_year_2025_26";

import {
  DURHAM_LLB_2025_26_FOUNDATION,
  DURHAM_LLB_2025_26_Y1,
  DURHAM_LLB_2025_26_Y2,
  DURHAM_LLB_2025_26_Y3,
} from "./academic_year_2025_26";

// Re-export types so the rest of the app can import from this barrel
export type { AcademicYearPlan, ModulePlan, Assessment, TermBlock };

// Master map for 2025/26
export const DURHAM_LLB_2025_26: Record<
  "foundation" | "year1" | "year2" | "year3",
  AcademicYearPlan
> = {
  foundation: DURHAM_LLB_2025_26_FOUNDATION,
  year1: DURHAM_LLB_2025_26_Y1,
  year2: DURHAM_LLB_2025_26_Y2,
  year3: DURHAM_LLB_2025_26_Y3,
};

export type YearKey = keyof typeof DURHAM_LLB_2025_26;

// Helper to pick default plan by student year (what the page calls)
export function getDefaultPlanByStudentYear(studentYear: YearKey): AcademicYearPlan {
  return DURHAM_LLB_2025_26[studentYear];
}

// Simple navigation helpers for prev/next year buttons
const ORDER: YearKey[] = ["foundation", "year1", "year2", "year3"];

export function getPrevYearKey(current: YearKey): YearKey {
  const i = ORDER.indexOf(current);
  return i > 0 ? ORDER[i - 1]! : ORDER[0]!;
}

export function getNextYearKey(current: YearKey): YearKey {
  const i = ORDER.indexOf(current);
  return i < ORDER.length - 1 ? ORDER[i + 1]! : ORDER[ORDER.length - 1]!;
}
