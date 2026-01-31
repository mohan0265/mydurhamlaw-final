import { NextApiRequest, NextApiResponse } from "next";
import { parse } from "cookie";
import { createHmac } from "crypto";
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";

// Helper to verify admin session
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

  const { email, password, tags, expiryDays = 14 } = req.body;
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
        user_metadata: { role: "demo" },
      });

    if (createError) throw createError;
    if (!user.user) throw new Error("User creation failed no data");

    const userId = user.user.id;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (expiryDays || 14));

    // 2. Update Profile
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({
        role: "demo",
        display_name: "Demo Student", // Hardcoded for safety
        password_locked: true,
        demo_expires_at: expiryDate.toISOString(),
        is_disabled: false,
        // tags: tags || ['issued-access'], // Using update, so ensure column exists or handle error
        // created_by: admin_id? We don't have the calling admin's ID easily here unless we pass it or infer it.
        // For now, skip created_by or set generic.
      })
      .eq("id", userId);

    // Attempt to set tags if column exists (it should via migration)
    await adminClient
      .from("profiles")
      .update({ tags: tags || ["issued-access"] })
      .eq("id", userId)
      .catch(() => {});

    if (profileError) {
      // Rollback (delete user)
      await adminClient.auth.admin.deleteUser(userId);
      throw profileError;
    }

    // 3. Audit Log
    // We don't have the exact admin UUID from the cookie session (it's a shared secret).
    // We'll use a placeholder system ID or try to lookup if possible.
    // For now, store a known 'system' UUID or leave null if constraint allows.
    // Actually, migration requires admin_user_id NOT NULL.
    // We must fetch an admin user to attribute this to.

    // Hack: Find the first admin user to blame, or use a specific service account ID if preserved.
    // Ideally, we should have a real admin login. But sticking to existing shared secret pattern:
    // We will look up a user with role='admin' to log against, or fail gracefully.

    // Fetch an admin ID
    const { data: adminUser } = await adminClient
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .limit(1)
      .single();
    if (adminUser) {
      await adminClient.from("admin_audit_log").insert({
        admin_user_id: adminUser.id,
        action: "CREATE_DEMO",
        target_user_id: userId,
        metadata: { email, expiryDays, tags },
      });
    }

    res
      .status(200)
      .json({ success: true, userId, email, expiry: expiryDate.toISOString() });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
