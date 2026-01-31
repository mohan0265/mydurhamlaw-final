import { NextApiRequest, NextApiResponse } from "next";
import { parse } from "cookie";
import { createHmac } from "crypto";
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";

export const verifyAdmin = (req: NextApiRequest) => {
  const token = parse(req.headers.cookie || "")["admin_session"];
  const adminUser = process.env.ADMIN_USERNAME;
  const adminPass = process.env.ADMIN_PASSWORD;

  if (!adminUser || !adminPass || !token) return false;
  const expected = createHmac("sha256", adminPass)
    .update(adminUser)
    .digest("hex");
  return token === expected;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });
  if (!verifyAdmin(req)) return res.status(401).json({ error: "Unauthorized" });

  // Accept both userId (standard) and id (legacy)
  const userId = req.body.userId || req.body.id;

  if (!userId) return res.status(400).json({ error: "Missing userId" });

  const adminClient = getSupabaseAdmin();
  if (!adminClient)
    return res.status(500).json({ error: "Admin client unavailable" });

  try {
    // Log info before delete
    const { data: profile } = await adminClient
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .single();

    // Delete Auth User (cascades to profile usually)
    const { error } = await adminClient.auth.admin.deleteUser(userId);
    if (error) throw error;

    // Manual profile delete if cascade fails? (Supabase verify normally cascades)

    // Log
    const { data: adminUser } = await adminClient
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .limit(1)
      .single();
    if (adminUser) {
      await adminClient.from("admin_audit_log").insert({
        admin_user_id: adminUser.id,
        action: "DELETE_USER",
        target_user_id: null, // User is gone
        metadata: { deleted_user_id: userId, email_was: profile?.email },
      });
    }

    res.status(200).json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
