import { UserProfile } from "./entitlements";
import { isDemoMode } from "./demo";

export function getPublicDisplayName(profile: UserProfile | null): string {
  // GLOBAL SAFETY OVERRIDE
  if (isDemoMode()) {
    return "Student";
  }

  if (!profile) return "Student";

  // Privacy Mask Logic
  if (profile.privacy_mask_name || profile.role === "demo") {
    return "Demo Student";
  }

  // Name Priority
  return profile.preferred_name || profile.display_name || "Student";
}
