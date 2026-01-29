/**
 * Access Control Configuration
 *
 * Controls who can access Caseway app
 * - Domain validation (Durham emails only)
 * - Trial management
 * - Admin allowlist
 */

// Allowed email domains (comma-separated in env)
export const ALLOWED_STUDENT_EMAIL_DOMAINS = (
  process.env.ALLOWED_STUDENT_EMAIL_DOMAINS || "durham.ac.uk"
)
  .split(",")
  .map((d) => d.trim().toLowerCase());

// Default trial duration (days)
export const TRIAL_DAYS_DEFAULT = parseInt(
  process.env.TRIAL_DAYS_DEFAULT || "30",
  10,
);

// App URL for redirects
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Check if email domain is allowed
 */
export function isAllowedDomain(email: string): boolean {
  if (!email) return false;
  const emailLower = email.toLowerCase().trim();
  const domain = emailLower.split("@")[1];
  return ALLOWED_STUDENT_EMAIL_DOMAINS.some(
    (d) => domain === d || domain?.endsWith(`.${d}`),
  );
}

/**
 * Calculate trial expiry date
 */
export function calculateTrialExpiry(days: number = TRIAL_DAYS_DEFAULT): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  return expiry;
}

/**
 * Check if trial is valid (not expired)
 */
export function isTrialValid(expiresAt: string | Date | null): boolean {
  if (!expiresAt) return true; // NULL = full access
  const expiryDate =
    typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
  return expiryDate > new Date();
}

/**
 * Access denial reasons
 */
export type AccessDenialReason =
  | "domain_not_allowed"
  | "not_in_allowlist"
  | "trial_expired"
  | "account_blocked"
  | "unknown";

export function getRestrictedMessageFor(reason: AccessDenialReason): string {
  switch (reason) {
    case "domain_not_allowed":
      return "Only Durham University students can access Caseway. Please use your @durham.ac.uk email.";
    case "not_in_allowlist":
      return "Please request trial access using your Durham email address.";
    case "trial_expired":
      return "Your trial period has expired. Please contact support to continue.";
    case "account_blocked":
      return "Your account has been restricted. Please contact support for assistance.";
    default:
      return "Access denied. Please contact support.";
  }
}
