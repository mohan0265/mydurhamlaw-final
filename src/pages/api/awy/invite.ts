// src/pages/api/awy/invite.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerUser } from "@/lib/api/serverAuth";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  try {
    const { user } = await getServerUser(req, res);
    if (!user) return res.status(401).json({ ok: false, error: "unauthenticated" });

    const { email, relationship, displayName } =
      (req.body as { email?: string; relationship?: string; displayName?: string }) || {};
    if (!email || !relationship) return res.status(400).json({ ok: false, error: "invalid_request" });

    let lovedUserId: string | null = null;

    // 1) Create or invite loved-one
    const invited = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { role: "loved_one" },
    });

    if (!invited.error) {
      lovedUserId = invited.data?.user?.id ?? null;
    } else {
      // If already exists, generate a magic link so we still get the user id reliably
      const msg = String(invited.error.message || "").toLowerCase();
      const already =
        invited.error.status === 422 ||
        msg.includes("already registered") ||
        msg.includes("already exist");
      if (already) {
        const link = await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email,
          options: { data: { role: "loved_one" } },
        });
        lovedUserId = link.data?.user?.id ?? null;
      } else {
        // Don’t explode—still record the connection as pending
        console.error("[awy/invite] invite error:", invited.error);
      }
    }

    // 2) Upsert connection
    const upsert = await supabaseAdmin
      .from("awy_connections")
      .upsert(
        {
          student_id: user.id,
          loved_email: email,
          relationship,
          display_name: displayName ?? null,
          loved_one_id: lovedUserId,
          loved_is_user: lovedUserId ? true : null,
          status: lovedUserId ? "active" : "pending",
          is_visible: true,
        },
        { onConflict: "student_id,loved_email" }
      )
      .select("id,loved_one_id")
      .single();

    if (upsert.error) throw upsert.error;

    // 3) Ensure loved-one has a profiles row (role = loved_one)
    if (lovedUserId) {
      await supabaseAdmin.from("profiles").upsert(
        { id: lovedUserId, user_role: "loved_one", agreed_to_terms: true },
        { onConflict: "id" }
      );
    }

    return res.status(200).json({
      ok: true,
      connectionId: upsert.data.id,
      lovedUserId,
      status: lovedUserId ? "active" : "pending",
    });
  } catch (err: any) {
    console.error("[awy/invite] fatal:", err);
    return res.status(500).json({ ok: false, error: err?.message || "server_error" });
  }
}
