export const BRAND_NAME = "Caseway";
export const BRAND_DOMAIN =
  process.env.NEXT_PUBLIC_APP_DOMAIN || "casewaylaw.ai";
export const BRAND_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || `https://${BRAND_DOMAIN}`;
export const BRAND_SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@casewaylaw.ai";
export const UNIVERSITY_INSTANCE_NAME = "Durham Law Edition";

/**
 * Returns the canonical URL for a given path.
 * Ensures the path starts with a slash and is prepended with the base URL.
 * @param urlPath - The path (e.g., "/about" or "about")
 */
export const BRAND_TAGLINE = " Empowering your legal education journey.";

export const LEGAL_DISCLAIMER_SHORT =
  "Caseway AI can make mistakes. Please verify.";

export const LEGAL_DISCLAIMER_LONG =
  "Caseway is an AI-powered independent study companion and is not affiliated with Durham University. Information provided should be verified against official module handbooks and primary legal sources.";

export const canonical = (urlPath: string) => {
  const path = urlPath.startsWith("/") ? urlPath : `/${urlPath}`;
  return `${BRAND_BASE_URL}${path}`;
};
