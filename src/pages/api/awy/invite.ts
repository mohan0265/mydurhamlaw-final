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
    // Resolve the currently logged-in student (cookie/Bearer handled in getServerUser)
    const { user } = await getServerUser(req, res);
    if (!user) return res.status(401).json({ ok: false, error: "unauthenticated" });

    const { email, relationship, displayName } =
      (req.body as { email?: string; relationship?: string; displayName?: string }) || {};
    if (!email || !relationship) {
      return res.status(400).json({ ok: false, error: "invalid_request" });
    }

    // --- 1) Ensure an auth user exists for the loved-one email ---
    let lovedUserId: string | null = null;

    // Try to invite (creates user iff missing)
    const invite = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { role: "loved_one" },
    });

    if (!invite.error) {
      lovedUserId = invite.data?.user?.id ?? null;
    } else {
      // If user already exists, invite may error; fall back to generating a magic link
      // which also returns the existing user object.
      const msg = String(invite.error?.message || "").toLowerCase();
      const isExists =
        invite.error.status === 422 ||
        msg.includes("already registered") ||
        msg.includes("already exists");

      if (isExists) {
        const link = await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email,
          options: { data: { role: "loved_one" } },
        });
        lovedUserId = link.data?.user?.id ?? null;
      } else {
        throw invite.error;
      }
    }

    // --- 2) Upsert connection and link loved_one_id if we have it ---
    const upsertConn = await supabaseAdmin
      .from("awy_connections")
      .upsert(
        {
          student_id: user.id,
          loved_one_id: lovedUserId, // may be null if invite queued oddly
          loved_email: email,
          relationship,
          display_name: displayName ?? null,
          loved_is_user: lovedUserId ? true : null,
          status: lovedUserId ? "active" : "pending",
          is_visible: true,
        },
        { onConflict: "student_id,loved_email" }
      )
      .select("id,loved_one_id")
      .single();

    if (upsertConn.error) throw upsertConn.error;

    // --- 3) Ensure profiles row for loved one (so role is set immediately) ---
    if (lovedUserId) {
      await supabaseAdmin.from("profiles").upsert(
        {
          id: lovedUserId,
          user_role: "loved_one",
          agreed_to_terms: true,
        },
        { onConflict: "id" }
      );
    }

    return res.status(200).json({
      ok: true,
      connectionId: upsertConn.data.id,
      lovedUserId,
      status: lovedUserId ? "active" : "pending",
    });
  } catch (err: any) {
    console.error("[awy/invite] error", err);
    return res.status(500).json({ ok: false, error: err?.message || "server_error" });
  }
}
