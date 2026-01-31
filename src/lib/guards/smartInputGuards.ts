/**
 * Smart Input Guards
 *
 * Heuristics for detecting common student mistakes during upload:
 * 1. Pasting URLs into transcript fields.
 * 2. Pasting transcripts into title fields.
 * 3. Normalizing messy titles.
 * 4. Sanity checking due dates.
 */

export type PasteType =
  | "url"
  | "transcript"
  | "markdown"
  | "plain"
  | "assignment_brief";

/**
 * Classifies the type of content being pasted based on regex heuristics.
 */
export function classifyContent(text: string): PasteType {
  const trimmed = text.trim();

  // URL detection (Panopto, YouTube, Blackboard)
  if (/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(trimmed)) {
    return "url";
  }

  // Markdown detection (Common for AI-generated notes)
  if (
    trimmed.includes("# ") ||
    trimmed.includes("**") ||
    (trimmed.includes("- ") && trimmed.split("\n").length > 3)
  ) {
    return "markdown";
  }

  // Transcript detection (Longer blocks of text without typical sentence structure)
  if (
    trimmed.length > 500 ||
    (trimmed.match(/\d{2}:\d{2}/g) || []).length > 3
  ) {
    return "transcript";
  }

  return "plain";
}

/**
 * Normalizes lecture or assignment titles.
 * - Fixes ALL CAPS
 * - Removes file extensions
 * - Trims whitespace
 */
export function normalizeTitle(title: string): string {
  let normalized = title.trim();

  // Remove common file extensions
  normalized = normalized.replace(/\.(pdf|docx?|mp3|m4a|wav|txt)$/i, "");

  // Fix ALL CAPS (if longer than 4 chars and mostly uppercase)
  if (normalized.length > 4 && normalized === normalized.toUpperCase()) {
    normalized = normalized.charAt(0) + normalized.slice(1).toLowerCase();
  }

  return normalized;
}

/**
 * Sanity checks for due dates.
 * Returns true if the date is suspiciously in the past or far future.
 */
export function isSuspiciousDate(dateStr: string): {
  isSuspicious: boolean;
  reason?: string;
} {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return { isSuspicious: false };

  const now = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(now.getFullYear() - 1);

  const twoYearsFuture = new Date();
  twoYearsFuture.setFullYear(now.getFullYear() + 2);

  if (date < oneYearAgo) {
    return { isSuspicious: true, reason: "Date is over a year in the past." };
  }

  if (date > twoYearsFuture) {
    return { isSuspicious: true, reason: "Date is very far in the future." };
  }

  // Check for common university "placeholder" dates (e.g., 01-01)
  const isJanFirst = date.getMonth() === 0 && date.getDate() === 1;
  if (isJanFirst) {
    return {
      isSuspicious: true,
      reason: "New Year's Day might be a placeholder date.",
    };
  }

  return { isSuspicious: false };
}

/**
 * Detects if a Panopto URL was pasted into a field that expected something else.
 */
export function isPanoptoUrl(text: string): boolean {
  return /panopto\.eu|panopto\.com/i.test(text);
}
