// src/pages/api/awy/connections.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerUser } from "@/lib/api/serverAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { user, supabase } = await getServerUser(req, res);
    if (!user) return res.status(401).json({ ok: false, error: "unauthenticated" });

    if (req.method === "GET") {
      // role
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_role")
        .eq("id", user.id)
        .maybeSingle();

      const userRole = (profile?.user_role as string) || "student";

      // grab raw connections without joins (joins are fragile on DBs with different FK names)
      const { data: rows, error } = await supabase
        .from("awy_connections")
        .select("*")
        .or(`student_id.eq.${user.id},loved_one_id.eq.${user.id}`)
        .eq("is_visible", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // collect peer ids to fetch display names
      const peerIds = Array.from(
        new Set(
          (rows || []).map(r => (r.student_id === user.id ? r.loved_one_id : r.student_id)).filter(Boolean)
        )
      );

      let names: Record<string, string> = {};
      if (peerIds.length) {
        const { data: peers } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", peerIds as string[]);
        (peers || []).forEach(p => { if (p?.id) names[p.id] = p.display_name || ""; });
      }

      const connections = (rows || []).map(r => {
        const isStudent = r.student_id === user.id || userRole === "student";
        const peerId = isStudent ? r.loved_one_id : r.student_id;
        const email = isStudent ? (r.loved_email || r.email || null) : null; // we usually only store loved_email
        return {
          id: r.id,
          peer_id: peerId,
          email,
          relationship: r.relationship_label ?? r.relationship ?? null,
          display_name: names[peerId] || null,
          status: r.status ?? null,
        };
      });

      return res.status(200).json({ ok: true, userRole, connections });
    }

    if (req.method === "DELETE") {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ ok: false, error: "Missing connection ID" });
      const { error } = await supabase.from("awy_connections").delete().eq("id", id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", ["GET", "DELETE"]);
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  } catch (err: any) {
    console.error("[awy/connections] Error:", err);
    return res.status(500).json({ ok: false, error: err?.message || "server_error" });
  }
}
