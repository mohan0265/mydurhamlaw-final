import type { NextApiRequest, NextApiResponse } from "next";
import { getServerUser } from "@/lib/api/serverAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { user, supabase } = await getServerUser(req, res);
    if (!user) {
      console.log("[awy/connections] No authenticated user");
      return res.status(401).json({ ok: false, error: "unauthenticated" });
    }

    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("awy_connections")
        .select("*")
        .eq("student_id", user.id)
        .eq("is_visible", true);

      if (error) {
        console.error("[awy/connections] DB error:", error);
        return res.status(500).json({ ok: false, error: error.message });
      }

      return res.status(200).json({
        ok: true,
        connections: data || [],
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
        .eq("id", id)
        .eq("student_id", user.id);

      if (error) {
        console.error("[awy/connections] Delete error:", error);
        return res.status(500).json({ ok: false, error: error.message });
      }

      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", ["GET", "DELETE"]);
    return res.status(405).json({ ok: false, error: "method_not_allowed" });

  } catch (err: any) {
    console.error("[awy/connections] Fatal error:", err);
    return res.status(500).json({ 
      ok: false, 
      error: err?.message || "server_error" 
    });
  }
}
