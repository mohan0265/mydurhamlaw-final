// src/lib/supabase/supabaseBridge.ts
import {
  KEY_DATES_2025_26,
  computeDaysUntil,
  computeNowPhase,
  todayISOInTZ,
} from "../durmah/phase";
import { getSupabaseClient } from '@/lib/supabase/client';
import type { MDLStudentContext, YearKey } from "../durmah/context";

type MinimalUser = { id: string; user_metadata?: Record<string, unknown> };

function deriveFirstName(meta?: Record<string, unknown>): string {
  return (
    (meta?.first_name as string) ||
    (meta?.firstName as string) ||
    (meta?.name as string) ||
    "there"
  );
}

function deriveYearKey(meta?: Record<string, unknown>): YearKey {
  const v = (meta?.yearKey as string) || (meta?.year as string) || "year1";
  return v === "foundation" || v === "year1" || v === "year2" || v === "year3"
    ? v
    : "year1";
}

export async function loadMDLStudentContext(
  user?: MinimalUser
): Promise<MDLStudentContext> {
  let u = user;
  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      if (!u) {
        const { data } = await supabase.auth.getSession();
        u = (data?.session?.user as MinimalUser) || undefined;
      }
    }
  } catch {
    // anonymous fallback ok
  }

  const firstName = u ? deriveFirstName(u.user_metadata) : "there";
  const yearKey = u ? deriveYearKey(u.user_metadata) : "year1";
  const userId = u?.id ?? "";

  const timezone = "Europe/London" as const;
  const keyDates = KEY_DATES_2025_26;
  const nowISO = todayISOInTZ(timezone);
  const daysUntil = computeDaysUntil(nowISO, keyDates);
  const nowPhase = computeNowPhase(nowISO, keyDates);

  const ctx: MDLStudentContext = {
    userId,
    firstName,
    university: "Durham University",
    programme: "LLB",
    yearKey,
    academicYear: "2025/26",
    timezone,
    keyDates,
    modules: [],
    nowPhase,
    daysUntil,
    hydrated: true,
  };

  if (typeof window !== "undefined") {
    (window as any).__mdlStudentContext = ctx;
  }
  return ctx;
}