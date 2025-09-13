// src/lib/durmah/context.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import type { KeyDates, AcademicPhase } from "./phase";
import {
  KEY_DATES_2025_26,
  computeDaysUntil,
  computeNowPhase,
  todayISOInTZ,
} from "./phase";

export type YearKey = "foundation" | "year1" | "year2" | "year3";
export type ModuleLite = { code: string; title: string; credits: number };

export type MDLStudentContext = {
  userId: string;
  firstName: string;
  university: "Durham University";
  programme: "LLB";
  yearKey: YearKey;
  academicYear: "2025/26";
  timezone: "Europe/London";
  keyDates: KeyDates;
  modules: ModuleLite[];
  nowPhase: AcademicPhase;
  daysUntil: { induction: number; teachingStart: number };
  hydrated: boolean;
};

declare global {
  interface Window {
    __mdlStudentContext?: MDLStudentContext;
  }
}

const AnonymousCtx: MDLStudentContext = {
  userId: "",
  firstName: "there",
  university: "Durham University",
  programme: "LLB",
  yearKey: "year1",
  academicYear: "2025/26",
  timezone: "Europe/London",
  keyDates: KEY_DATES_2025_26,
  modules: [],
  nowPhase: "pre_induction",
  daysUntil: { induction: 0, teachingStart: 0 },
  hydrated: false,
};

const Ctx = createContext<MDLStudentContext>(AnonymousCtx);

export function DurmahProvider({ children }: { children: React.ReactNode }) {
  const [ctx, setCtx] = useState<MDLStudentContext>(AnonymousCtx);

  useEffect(() => {
    const fromWindow =
      typeof window !== "undefined" ? window.__mdlStudentContext : undefined;
    if (fromWindow) {
      setCtx({ ...fromWindow, hydrated: true });
    } else {
      const nowISO = todayISOInTZ("Europe/London");
      const daysUntil = computeDaysUntil(nowISO, KEY_DATES_2025_26);
      const nowPhase = computeNowPhase(nowISO, KEY_DATES_2025_26);
      const anon: MDLStudentContext = {
        ...AnonymousCtx,
        daysUntil,
        nowPhase,
        hydrated: true,
      };
      if (typeof window !== "undefined") window.__mdlStudentContext = anon;
      setCtx(anon);
    }
  }, []);

  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>;
}

export function useDurmah(): MDLStudentContext {
  return useContext(Ctx);
}

export function DurmahContextSetup({
  preloaded,
}: {
  preloaded?: Partial<MDLStudentContext>;
}) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const existing = window.__mdlStudentContext;
    if (existing && existing.hydrated) return;

    const base = {
      userId: preloaded?.userId ?? "",
      firstName: preloaded?.firstName ?? "there",
      university: "Durham University" as const,
      programme: "LLB" as const,
      yearKey: (preloaded?.yearKey ?? "year1") as YearKey,
      academicYear: "2025/26" as const,
      timezone: "Europe/London" as const,
      keyDates: preloaded?.keyDates ?? KEY_DATES_2025_26,
      modules: preloaded?.modules ?? [],
    };
    const nowISO = todayISOInTZ("Europe/London");
    const daysUntil = computeDaysUntil(nowISO, base.keyDates);
    const nowPhase = computeNowPhase(nowISO, base.keyDates as any);
    const full: MDLStudentContext = {
      ...(base as any),
      daysUntil,
      nowPhase,
      hydrated: true,
    };
    window.__mdlStudentContext = full;
  }, [preloaded]);

  return null;
}

export function yearLabel(y: YearKey) {
  if (y === "foundation") return "Foundation";
  if (y === "year1") return "Year 1";
  if (y === "year2") return "Year 2";
  return "Year 3";
}