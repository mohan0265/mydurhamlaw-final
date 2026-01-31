import { UserProfile } from "./entitlements";

export function getPublicDisplayName(profile: UserProfile | null): string {
  if (!profile) return "Student";

  // Privacy Mask Logic
  if (profile.privacy_mask_name || profile.role === "demo") {
    return "Demo Student";
  }

  // Name Priority
  return profile.preferred_name || profile.display_name || "Student";
}
