import type { NextApiRequest, NextApiResponse } from "next";
import { getServerUser } from "@/lib/api/serverAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { user, supabase } = await getServerUser(req, res);
    if (!user) {
      return res.status(401).json({ ok: false, error: "unauthenticated" });
    }

    if (req.method === "GET") {
      // Get presence for all connected users
      const { data: connections } = await supabase
        .from("awy_connections")
        .select("student_id, loved_one_id")
        .or(`student_id.eq.${user.id},loved_one_id.eq.${user.id}`)
        .eq("status", "active");

      const connectedUserIds = new Set<string>();
      connections?.forEach(conn => {
        if (conn.student_id !== user.id) connectedUserIds.add(conn.student_id);
        if (conn.loved_one_id && conn.loved_one_id !== user.id) connectedUserIds.add(conn.loved_one_id);
      });

      if (connectedUserIds.size === 0) {
        return res.status(200).json({});
      }

      const { data: presenceData } = await supabase
        .from("awy_presence")
        .select("user_id, status, is_available_for_calls, last_seen")
        .in("user_id", Array.from(connectedUserIds));

      const presenceMap: Record<string, any> = {};
      presenceData?.forEach(p => {
        presenceMap[p.user_id] = {
          status: p.status,
          available: p.is_available_for_calls,
          lastSeen: p.last_seen
        };
      });

      return res.status(200).json(presenceMap);
    }

    if (req.method === "POST") {
      // Update user's own presence
      const { status, isAvailable, customMessage } = req.body;

      const { error } = await supabase
        .from("awy_presence")
        .upsert({
          user_id: user.id,
          status: status || "online",
          is_available_for_calls: isAvailable ?? true,
          custom_message: customMessage,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (error) throw error;

      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ ok: false, error: "method_not_allowed" });

  } catch (err: any) {
    console.error("[awy/presence] Error:", err);
    return res.status(500).json({ 
      ok: false, 
      error: err?.message || "server_error" 
    });
  }
}
