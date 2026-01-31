export function isDemoMode(): boolean {
  // 1. Env Var (Server & Client)
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return true;

  // 2. Client-side checks
  if (typeof window !== "undefined") {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("demo") === "1") return true;

      if (window.localStorage.getItem("caseway_demo_mode") === "true")
        return true;
    } catch (e) {
      // Ignore errors (e.g. if window/localStorage access is blocked)
    }
  }

  return false;
}

export const DEMO_STUDENT_PROFILE = {
  id: "demo-student",
  user_id: "demo-student-uid",
  email: "student@demo.com",
  display_name: "Student",
  preferred_name: "Student",
  role: "demo",
  privacy_mask_name: true,
  is_test_account: false,
  year_group: "Year 2",
  university: "Durham University",
};
