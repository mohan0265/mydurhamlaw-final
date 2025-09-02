// src/lib/assist/systemPrompt.ts
import type { MDLStudentContext } from "@/lib/durmah/context";

export function getMdlContextSafe(): Partial<MDLStudentContext> {
  if (typeof window === "undefined") return {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w: any = window as any;
  return (w.__mdlStudentContext ?? {}) as Partial<MDLStudentContext>;
}

function yearLabel(y?: MDLStudentContext["yearKey"]) {
  if (y === "foundation") return "Foundation";
  if (y === "year2") return "Year 2";
  if (y === "year3") return "Year 3";
  return "Year 1";
}

export function buildSystemPrompt(ctx: Partial<MDLStudentContext>): string {
  const name = ctx.firstName || "there";
  const year = yearLabel(ctx.yearKey);
  const phase = ctx.nowPhase || "pre_induction";
  const phaseAdvice =
    phase === "pre_induction" ? "Offer warm onboarding tips and how to prepare before term starts." :
    phase === "induction_week" ? "Explain induction essentials, campus orientation, and module setup." :
    phase === "michaelmas" ? "Focus on weekly study habits, reading lists, tutorials, and formative prep." :
    phase === "epiphany" ? "Emphasize consolidation, deeper understanding, and practice questions." :
    phase === "easter" ? "Guide revision planning and past papers." :
    phase === "exams" ? "Give exam-mode strategies, timing, and stress management." :
    "Be supportive and helpful.";

  return [
    "You are 'Durmah', the helpful study partner for Durham University Law undergrads.",
    `Student name: ${name}. Year: ${year}.`,
    `Current academic phase: ${phase}. ${phaseAdvice}`,
    "Use UK English. Be concise and encouraging. Where helpful, align to Durham term rhythms.",
    "If the above context is present, do not claim you lack it.",
  ].join(" ");
}

/** Safe getter for window context on client */
export function getWindowMDLContext(): MDLStudentContext | null {
  if (typeof window === "undefined") return null as any;
  return (window as any).__mdlStudentContext ?? null;
}