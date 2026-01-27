import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/supabase/AuthContext";

export type FeatureKey =
  | "lectures"
  | "assignments"
  | "quiz_me"
  | "exam_prep"
  | "yaag";

export type FamiliarityState = Record<FeatureKey, boolean>;

const DEFAULT_FAMILIARITY: FamiliarityState = {
  lectures: false,
  assignments: false,
  quiz_me: false,
  exam_prep: false,
  yaag: false,
};

export function useFamiliarity() {
  const { user, supabase } = useAuth();
  const [familiarity, setFamiliarity] =
    useState<FamiliarityState>(DEFAULT_FAMILIARITY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !supabase) {
      setLoading(false);
      return;
    }

    async function fetchFamiliarity() {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("feature_familiarity")
          .eq("id", user?.id)
          .maybeSingle();

        if (error) throw error;

        if (data?.feature_familiarity) {
          setFamiliarity({
            ...DEFAULT_FAMILIARITY,
            ...data.feature_familiarity,
          });
        }
      } catch (err) {
        console.error("Error fetching familiarity:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchFamiliarity();
  }, [user, supabase]);

  const markAsFamiliar = useCallback(
    async (feature: FeatureKey) => {
      if (!user || !supabase) return;

      try {
        const newState = { ...familiarity, [feature]: true };
        setFamiliarity(newState);

        const { error } = await supabase
          .from("profiles")
          .update({ feature_familiarity: newState })
          .eq("id", user.id);

        if (error) {
          // Handle case where column doesn't exist yet (graceful degradation)
          if (error.code === "42703") {
            console.warn(
              "feature_familiarity column missing, using local state only.",
            );
          } else {
            throw error;
          }
        }
      } catch (err) {
        console.error("Error updating familiarity:", err);
      }
    },
    [user, supabase, familiarity],
  );

  return { familiarity, loading, markAsFamiliar };
}
