// src/pages/api/awy/connections.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerUser } from "@/lib/api/serverAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  try {
    const { user, supabase } = await getServerUser(req, res);
    if (!user) return res.status(401).json({ ok: false, error: "unauthenticated" });

    const { data, error } = await supabase
      .from("awy_connections")
      .select("*")
      .eq("student_id", user.id)
      .eq("is_visible", true);

    if (error) throw error;

    return res.status(200).json({
      ok: true,
      connections: data || [],
    });
  } catch (err: any) {
    console.error("[awy/connections] error:", err);
    return res.status(500).json({ ok: false, error: err?.message || "server_error" });
  }
}
