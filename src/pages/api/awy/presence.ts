// src/pages/api/awy/presence.ts
// Direct-to-DB, schema-tolerant presence API
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerUser } from "@/lib/api/serverAuth";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";

async function connectedUserIdsFor(studentId: string): Promise<string[]> {
  // Try schema A
  const qA = await supabaseAdmin
    .from("awy_connections")
    .select("connected_user_id")
    .eq("user_id", studentId)
    .not("connected_user_id", "is", null);

  if (!qA.error)
    return (qA.data || []).map((r: any) => r.connected_user_id).filter(Boolean);

  // Schema B
  const qB = await supabaseAdmin
    .from("awy_connections")
    .select("loved_one_id")
    .eq("student_id", studentId)
    .not("loved_one_id", "is", null);

  if (qB.error) throw qB.error;
  return (qB.data || []).map((r: any) => r.loved_one_id).filter(Boolean);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user } = await getServerUser(req, res);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  try {
    switch (req.method) {
      case "GET": {
        const ids = await connectedUserIdsFor(user.id);
        if (ids.length === 0) return res.status(200).json({ presence: {} });

        const { data, error } = await supabaseAdmin
          .from("awy_presence")
          .select("user_id,is_online,current_activity,last_seen")
          .in("user_id", ids);

        if (error) throw error;

        const map: Record<string, any> = {};
        (data || []).forEach((p: any) => (map[p.user_id] = p));
        return res.status(200).json({ presence: map });
      }

      case "POST": {
        const payload = (req.body as any) || {};
        const { error } = await supabaseAdmin
          .from("awy_presence")
          .upsert(
            {
              user_id: user.id,
              is_online: !!payload.is_online,
              current_activity: payload.current_activity ?? null,
              last_seen: payload.last_seen ?? new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );

        if (error) throw error;
        return res.status(200).json({ success: true, message: "Presence updated successfully" });
      }

      default: {
        res.setHeader("Allow", ["GET", "POST"]);
        return res.status(405).json({ error: "Method not allowed" });
      }
    }
  } catch (e: any) {
    console.error("[awy/presence] error:", e);
    return res.status(500).json({ error: e?.message || "service_error" });
  }
}
