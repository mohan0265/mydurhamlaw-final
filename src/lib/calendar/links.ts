// src/lib/calendar/links.ts
// Small helpers shared by Year/Month/Week pages

export type YearKey = "foundation" | "year1" | "year2" | "year3";

export const YEAR_LABEL: Record<YearKey, string> = {
  foundation: "Foundation",
  year1: "Year 1",
  year2: "Year 2",
  year3: "Year 3",
};

// --- URL helpers -------------------------------------------------------------

export function hrefYear(y: YearKey): string {
  return `/year-at-a-glance?y=${y}`;
}

export function hrefMonth(y: YearKey): string {
  return `/year-at-a-glance/month?y=${y}`;
}

export function hrefWeek(y: YearKey, w?: string | number): string {
  const q: string[] = [];
  if (y) q.push(`y=${y}`);
  if (w !== undefined) q.push(`w=${w}`);
  return `/year-at-a-glance/week${q.length ? `?${q.join("&")}` : ""}`;
}

// --- read/persist selected year (client only; safe no-op on SSR) ------------

const LS_KEY = "mdl_year_key";

export function persistYearKey(y: YearKey) {
  try {
    localStorage.setItem(LS_KEY, y);
  } catch {}
}

export function readYearKey(): YearKey {
  try {
    const v = localStorage.getItem(LS_KEY);
    return parseYearKey(v);
  } catch {
    return "year1";
  }
}

// Accepts anything from router/query and normalises to YearKey
export function parseYearKey(input: unknown): YearKey {
  const s = String(input ?? "").toLowerCase();
  const valid: YearKey[] = ["foundation", "year1", "year2", "year3"];
  return (valid.includes(s as YearKey) ? (s as YearKey) : "year1");
}

// --- prev/next year key helpers for top-nav arrows --------------------------

const ORDER: YearKey[] = ["foundation", "year1", "year2", "year3"];

export function getPrevYearKey(current: YearKey): YearKey {
  const i = ORDER.indexOf(current);
  return i > 0 ? ORDER[i - 1]! : ORDER[0]!;
}

export function getNextYearKey(current: YearKey): YearKey {
  const i = ORDER.indexOf(current);
  return i < ORDER.length - 1 ? ORDER[i + 1]! : ORDER[ORDER.length - 1]!;
}
