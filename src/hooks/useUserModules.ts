import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export interface UserModule {
  user_module_id: string;
  module_code: string;
  module_title: string;
  color_theme?: string;
  staff_names?: string[];
}

export function useUserModules() {
  const [modules, setModules] = useState<UserModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchModules() {
      try {
        const { data, error } = await supabase
          .from("user_modules")
          .select(
            `
            user_module_id,
            staff_names,
            module_catalog (
              module_code,
              module_title,
              color_theme
            )
          `,
          )
          .eq("status", "active");

        if (error) throw error;

        // Flatten the data structure
        const formattedModules = (data || []).map((item: any) => ({
          user_module_id: item.user_module_id,
          module_code: item.module_catalog?.module_code || "UNKNOWN",
          module_title: item.module_catalog?.module_title || "Unknown Module",
          color_theme: item.module_catalog?.color_theme,
          staff_names: item.staff_names || [],
        }));

        setModules(formattedModules);
      } catch (err: any) {
        console.error("Error fetching user modules:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchModules();
  }, [supabase]);

  return { modules, loading, error };
}
