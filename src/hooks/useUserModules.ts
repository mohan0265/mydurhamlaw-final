import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export interface UserModule {
  id: string;
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
            id,
            staff_names,
            module_catalog:catalog_id (
              code,
              title,
              created_at
            )
          `,
          )
          .eq("is_active", true);

        if (error) throw error;

        // Flatten the data structure
        const formattedModules = (data || []).map((item: any) => ({
          id: item.id,
          module_code: item.module_catalog?.code || "UNKNOWN",
          module_title: item.module_catalog?.title || "Unknown Module",
          color_theme: item.module_catalog?.color_theme || "purple",
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
