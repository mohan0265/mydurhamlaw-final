import type { NextApiRequest, NextApiResponse } from "next";
import { getServerUser } from "@/lib/api/serverAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { user, supabase } = await getServerUser(req, res);
    if (!user) {
      return res.status(401).json({ ok: false, error: "unauthenticated" });
    }

    if (req.method === "GET") {
      console.log("[awy/connections] Fetching connections for user:", user.id);

      // Get user's role first
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_role")
        .eq("id", user.id)
        .single();

      const userRole = profile?.user_role || "student";
      console.log("[awy/connections] User role:", userRole);

      let connections = [];

      if (userRole === "student") {
        // Student: Get their loved ones
        const { data, error } = await supabase
          .from("awy_connections")
          .select(`
            *,
            loved_one_profile:profiles!awy_connections_loved_one_id_fkey(
              display_name,
              user_role
            )
          `)
          .eq("student_id", user.id)
          .eq("is_visible", true)
          .order("created_at", { ascending: false });

        if (error) throw error;
        connections = data || [];
      } else {
        // Loved one: Get their students
        const { data, error } = await supabase
          .from("awy_connections")
          .select(`
            *,
            student_profile:profiles!awy_connections_student_id_fkey(
              display_name,
              user_role
            )
          `)
          .eq("loved_one_id", user.id)
          .eq("is_visible", true)
          .order("created_at", { ascending: false });

        if (error) throw error;
        connections = data || [];
      }

      console.log(`[awy/connections] Found ${connections.length} connections`);

      return res.status(200).json({
        ok: true,
        connections,
        userRole
      });
    }

    if (req.method === "DELETE") {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ ok: false, error: "Missing connection ID" });
      }

      const { error } = await supabase
        .from("awy_connections")
        .delete()
        .eq("id", id);

      if (error) throw error;

      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", ["GET", "DELETE"]);
    return res.status(405).json({ ok: false, error: "method_not_allowed" });

  } catch (err: any) {
    console.error("[awy/connections] Error:", err);
    return res.status(500).json({ 
      ok: false, 
      error: err?.message || "server_error" 
    });
  }
}
