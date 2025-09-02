// src/lib/assist/systemPrompt.ts
import type { MDLStudentContext } from "@/lib/durmah/context";

export function buildSystemPrompt(ctx?: MDLStudentContext | null) {
  const base = [
    "You are Durmah — a friendly, practical AI study partner for Durham University Law undergraduates.",
    "Tone: concise, supportive, specific. Offer examples, links to site pages, or 'what to do next' suggestions.",
    "NEVER say you don't know the user if context is present. Use the provided context.",
  ].join(" ");

  if (!ctx) {
    return `${base}\nNo MDL context provided. Use general study help for a Durham undergrad in Law.`;
  }

  const { firstName, yearKey, academicYear, timezone, nowPhase, daysUntil } = ctx;
  return [
    base,
    "",
    "### MDL Context",
    `Name: ${firstName}`,
    `Year: ${yearKey} (${academicYear})`,
    `Timezone: ${timezone}`,
    `Current academic phase: ${nowPhase}`,
    `DaysUntil: induction=${daysUntil.induction}, teachingStart=${daysUntil.teachingStart}`,
    "",
    "Guidance:",
    "- Address the student by first name when it feels natural.",
    "- If phase is pre_induction or induction_week → focus on settling in, module overviews, and planning.",
    "- If phase is michaelmas/epiphany/easter → suggest week-by-week study tactics and key cases for current modules.",
    "- If exams → prioritise revision plans, past papers, and high-yield topics.",
  ].join("\n");
}

/** Safe getter for window context on client */
export function getWindowMDLContext(): MDLStudentContext | null {
  if (typeof window === "undefined") return null as any;
  return (window as any).__mdlStudentContext ?? null;
}