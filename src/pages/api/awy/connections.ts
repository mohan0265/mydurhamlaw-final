import type { NextApiRequest, NextApiResponse } from "next";
import { getServerUser } from "@/lib/api/serverAuth";

/**
 * Returns the caller's AWY connections without relying on PostgREST FK-joins.
 * We first fetch connections, then fetch the relevant profiles in a second query.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { user, supabase } = await getServerUser(req, res);
    if (!user) return res.status(401).json({ ok: false, error: "unauthenticated" });

    if (req.method === "GET") {
      // fetch user role (default to 'student')
      const { data: profRow } = await supabase
        .from("profiles")
        .select("user_role, display_name")
        .eq("id", user.id)
        .single();

      const userRole = (profRow?.user_role as string) || "student";

      // get connections (raw)
      const { data: connsRaw, error: cErr } = await supabase
        .from("awy_connections")
        .select("*")
        .eq(userRole === "student" ? "student_id" : "loved_one_id", user.id)
        .eq("is_visible", true)
        .order("created_at", { ascending: false });

      if (cErr) throw cErr;
      const connections = connsRaw || [];

      // collect profile IDs to hydrate names
      const ids =
        userRole === "student"
          ? connections.map((c: any) => c.loved_one_id).filter(Boolean)
          : connections.map((c: any) => c.student_id).filter(Boolean);

      let profilesById: Record<string, { display_name?: string; user_role?: string }> = {};
      if (ids.length) {
        const { data: profs, error: pErr } = await supabase
          .from("profiles")
          .select("id, display_name, user_role")
          .in("id", Array.from(new Set(ids)));

        if (!pErr && profs) {
          profilesById = Object.fromEntries(
            profs.map((p: any) => [p.id, { display_name: p.display_name, user_role: p.user_role }])
          );
        }
      }

      // normalize to client shape (email may be stored as loved_email on the row)
      const normalized = connections.map((row: any) => {
        const otherId = userRole === "student" ? row.loved_one_id : row.student_id;
        const prof = otherId ? profilesById[otherId] : undefined;

        return {
          id: row.id as string,
          email: String(row.loved_email || row.email || '').toLowerCase(),
          relationship: row.relationship_label ?? row.relationship ?? null,
          display_name: prof?.display_name ?? row.loved_name ?? row.student_name ?? null,
          status: row.status ?? null,
        };
      });

      return res.status(200).json({ ok: true, connections: normalized, userRole });
    }

    if (req.method === "DELETE") {
      const { id } = (req.body as { id?: string }) || {};
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
