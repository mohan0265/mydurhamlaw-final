import { NextApiRequest, NextApiResponse } from "next";
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";
import { isAuthenticatedAdmin } from "@/lib/server/adminAuth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });
  if (!isAuthenticatedAdmin(req))
    return res.status(401).json({ error: "Unauthorized" });

  const { email, password, displayName, pronunciation, preferredName } =
    req.body;

  if (!email || !password || !displayName) {
    return res
      .status(400)
      .json({
        error: "Missing required fields (email, password, displayName)",
      });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return res.status(500).json({ error: "Server misconfigured" });

  try {
    // 1. Create Auth User
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          role: "test_user",
          display_name: displayName,
          first_name: displayName, // Fallback for some UIs
        },
      });

    if (authError || !authData.user) {
      throw new Error(authError?.message || "Failed to create auth user");
    }

    // 2. Update Profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        role: "test_user",
        display_name: displayName,
        preferred_name: preferredName || null,
        name_pronunciation: pronunciation || null,
        privacy_mask_name: false,
        password_locked: true, // Testers shouldn't change password of shared test account
        is_disabled: false,
      })
      .eq("id", authData.user.id);

    if (profileError) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new Error("Failed to create profile: " + profileError.message);
    }

    return res.status(200).json({
      success: true,
      email,
      id: authData.user.id,
    });
  } catch (err: any) {
    console.error("Create Test User Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
