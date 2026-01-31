import { useState, useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { getPublicDisplayName } from "@/lib/name";
import { UserProfile } from "@/lib/entitlements";

export const useUserDisplayName = () => {
  const [displayName, setDisplayName] = useState<string>("");

  useEffect(() => {
    const getDisplayName = async () => {
      try {
        const supabase = getSupabaseClient();
        if (!supabase) {
          setDisplayName("Student");
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        const user = session?.user;

        if (!user) {
          setDisplayName("");
          return;
        }

        const { data: userProfile } = await supabase
          .from("profiles")
          .select("*") // Get all fields to check privacy
          .eq("id", user.id)
          .maybeSingle();

        if (userProfile) {
          setDisplayName(getPublicDisplayName(userProfile as UserProfile));
        } else {
          // Fallback for no profile (shouldn't happen often)
          const emailName = user.email?.split("@")[0] || "Student";
          setDisplayName(emailName);
        }
      } catch (error) {
        console.error("Error getting display name:", error);
        setDisplayName("Student");
      }
    };

    getDisplayName();
  }, []);

  return { displayName };
};
