// src/pages/api/awy/connections.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerUser } from "@/lib/api/serverAuth";

type Json = Record<string, unknown>;

function ok<T extends Json>(res: NextApiResponse, body: T) {
  return res.status(200).json({ ok: true, ...body });
}

function failSoft<T extends Json>(res: NextApiResponse, body: T, warn: unknown) {
  const message = (warn as any)?.message ?? warn;
  console.warn("[awy] soft-fail:", message);
  return res.status(200).json({ ok: true, ...body });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user, supabase } = await getServerUser(req, res);
  if (!user) {
    return res.status(401).json({ ok: false, error: "unauthenticated" });
  }

  if (req.method === "GET") {
    let userRole = "student";
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_role")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (data?.user_role) userRole = String(data.user_role);
    } catch (profileError: any) {
      console.warn("[awy/connections] profile lookup failed:", profileError);
    }

    try {
      let query = supabase
        .from("awy_connections")
        .select(
          "id, student_id, loved_one_id, loved_email, relationship_label, relationship, status, is_visible, created_at"
        )
        .eq("is_visible", true);

      if (userRole === "student") {
        query = query.eq("student_id", user.id);
      } else if (userRole === "loved_one") {
        query = query.eq("loved_one_id", user.id);
      } else {
        query = query.or('student_id.eq.' + user.id + ',loved_one_id.eq.' + user.id);
      }

      const { data: rows, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      const connectionsRows = rows ?? [];

      const peerIds = Array.from(
        new Set(
          connectionsRows
            .map((r: any) => (r.student_id === user.id ? r.loved_one_id : r.student_id))
            .filter((id: unknown): id is string => typeof id === "string" && id.length > 0)
        )
      );

      const names: Record<string, string> = {};
      if (peerIds.length) {
        try {
          const { data: peers, error: peersError } = await supabase
            .from("profiles")
            .select("id, display_name")
            .in("id", peerIds);

          if (peersError) throw peersError;
          (peers ?? []).forEach((p: any) => {
            if (p?.id) names[p.id] = p.display_name || "";
          });
        } catch (nameError: any) {
          console.warn("[awy/connections] name enrichment skipped:", nameError);
        }
      }

      const connections = connectionsRows.map((r: any) => {
        const peerId = r.student_id === user.id ? r.loved_one_id : r.student_id;
        const email = typeof r.loved_email === "string" ? r.loved_email.toLowerCase() : "";
        return {
          id: r.id,
          email,
          relationship: r.relationship_label || r.relationship || null,
          display_name: peerId ? names[peerId] || null : null,
          status: r.status ?? null,
        };
      });

      return ok(res, { connections, userRole });
    } catch (queryError: any) {
      return failSoft(res, { connections: [], userRole }, queryError);
    }
  }

  if (req.method === "DELETE") {
    const { id } = (req.body ?? {}) as { id?: string };
    if (!id) {
      return res.status(400).json({ ok: false, error: "Missing connection ID" });
    }

    try {
      const { error } = await supabase.from("awy_connections").delete().eq("id", id);
      if (error) throw error;
      return ok(res, {});
    } catch (deleteError: any) {
      return failSoft(res, {}, deleteError);
    }
  }

  res.setHeader("Allow", ["GET", "DELETE"]);
  return res.status(405).json({ ok: false, error: "method_not_allowed" });
}