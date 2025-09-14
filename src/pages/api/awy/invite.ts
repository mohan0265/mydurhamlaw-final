import type { NextApiRequest, NextApiResponse } from "next";
import { getSupabaseFromCookies, getSupabaseAdmin } from "@/lib/supabase/server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const supa = getSupabaseFromCookies(req, res);
  const admin = getSupabaseAdmin();

  const { data: auth } = await supa.auth.getUser();
  const me = auth?.user;
  if (!me) return res.status(401).json({ error: "Not authenticated" });

  const { email, relationship, displayName } = (req.body ?? {}) as {
    email?: string;
    relationship?: string;
    displayName?: string;
  };
  const lovedEmail = (email || "").trim().toLowerCase();
  if (!lovedEmail || !relationship) {
    return res.status(400).json({ error: "Missing email or relationship" });
  }

  // 1) See if the loved one already has an auth account
  let lovedUserId: string | null = null;
  try {
    const { data: byEmail } = await admin.auth.getUserByEmail(lovedEmail);
    lovedUserId = byEmail?.user?.id ?? null;
  } catch {
    // ignore
  }

  // 2) If not an existing user, send an invite
  if (!lovedUserId) {
    try {
      await admin.auth.inviteUserByEmail(lovedEmail, {
        data: { user_type: "loved_one" },
      });
    } catch {
      // If invite fails because user exists or other benign reason, keep going.
    }
  }

  // 3) Upsert the connection (unique per student + loved_email enforced in DB)
  const { data, error } = await admin
    .from("awy_connections")
    .upsert(
      {
        student_id: me.id,
        loved_email: lovedEmail,
        relationship_label: relationship,
        display_name: displayName || null,
        loved_one_id: lovedUserId,
        loved_is_user: !!lovedUserId,
      },
      { onConflict: "student_id,loved_email" }
    )
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // 4) (Optional) precreate/update a profiles row for the loved user if we know them
  if (lovedUserId) {
    await admin.from("profiles").upsert(
      { id: lovedUserId, user_type: "loved_one" },
      { onConflict: "id" }
    );
  }

  return res.json({
    id: data.id,
    email: data.loved_email,
    relationship: data.relationship_label,
    display_name: data.display_name,
    status: data.loved_is_user ? "active" : "invited",
  });
}
