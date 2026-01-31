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

  if (!verifyAdmin(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { email, displayName, password, yearGroup } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const adminClient = getSupabaseAdmin();
  if (!adminClient)
    return res.status(500).json({ error: "Admin client unavailable" });

  try {
    // 1. Create Auth User
    const { data: user, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: displayName },
      });

    if (createError) throw createError;
    if (!user.user) throw new Error("User creation failed no data");

    const userId = user.user.id;

    // 2. Update Profile
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({
        role: "user", // Standard user
        display_name: displayName,
        year_group: yearGroup || "Year 1",
        is_disabled: false,
      })
      .eq("id", userId);

    if (profileError) {
      // Rollback
      await adminClient.auth.admin.deleteUser(userId);
      throw profileError;
    }

    // 3. Audit Log
    const { data: adminUser } = await adminClient
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .limit(1)
      .single();
    if (adminUser) {
      await adminClient.from("admin_audit_log").insert({
        admin_user_id: adminUser.id,
        action: "CREATE_STUDENT",
        target_user_id: userId,
        metadata: { email, yearGroup },
      });
    }

    res.status(200).json({ success: true, userId, email });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
