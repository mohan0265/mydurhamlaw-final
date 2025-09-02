// src/lib/assist/systemPrompt.ts
import type { MDLStudentContext } from "@/lib/durmah/context";

export function getMdlContextSafe(): Partial<MDLStudentContext> {
  if (typeof window === "undefined") return {};
  const w = window as unknown as { __mdlStudentContext?: MDLStudentContext };
  return (w.__mdlStudentContext ?? {}) as Partial<MDLStudentContext>;
}

function yearLabel(y?: MDLStudentContext["yearKey"]) {
  switch (y) {
    case "foundation": return "Foundation";
    case "year2": return "Year 2";
    case "year3": return "Year 3";
    default: return "Year 1";
  }
}

const PHASE_ADVICE: Record<NonNullable<MDLStudentContext["nowPhase"]> | "pre_induction", string> = {
  pre_induction: "Offer warm onboarding tips and how to prepare before term starts.",
  induction_week: "Explain induction essentials, campus orientation, and module setup.",
  michaelmas: "Focus on weekly study habits, reading lists, tutorials, and formative prep.",
  epiphany: "Emphasize consolidation, deeper understanding, and practice questions.",
  easter: "Guide revision planning and past papers.",
  exams: "Give exam-mode strategies, timing, and stress management.",
  vacation: "Be supportive and help with reflection, reading, and light prep.",
};

export function buildSystemPrompt(ctx: Partial<MDLStudentContext>): string {
  const name = ctx.firstName || "there";
  const year = yearLabel(ctx.yearKey);
  const phase = ctx.nowPhase || "pre_induction";
  const phaseAdvice = PHASE_ADVICE[phase] || "Be supportive and helpful.";

  return [
    "You are 'Durmah', the helpful study partner for Durham University Law undergrads.",
    `Student name: ${name}. Year: ${year}.`,
    `Current academic phase: ${phase}. ${phaseAdvice}`,
    "Use UK English. Be concise and encouraging. Where helpful, align to Durham term rhythms.",
    "If the above context is present, do not claim you lack it.",
  ].join(" ");
}

/** Optional: direct window accessor if a component needs it */
export function getWindowMDLContext(): MDLStudentContext | null {
  if (typeof window === "undefined") return null;
  return (window as any).__mdlStudentContext ?? null;
}
