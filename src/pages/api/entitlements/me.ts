import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const supabase = createPagesServerClient({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  console.log("[api/entitlements/me] Fetching for user:", session.user.id);

  const { data: entitlements, error } = await supabase
    .from("user_entitlements")
    .select("*")
    .eq("user_id", session.user.id)
    .eq("status", "ACTIVE");

  if (error) {
    console.error("[api/entitlements/me] DB Error:", error);
    return res.status(500).json({ error: error.message });
  }

  console.log(
    "[api/entitlements/me] Found entitlements:",
    entitlements?.length || 0,
  );

  const hasDurhamAccess =
    entitlements?.some((e) => e.product === "DURHAM") || false;
  const hasLnatAccess =
    entitlements?.some((e) => e.product === "LNAT") || false;

  // Example feature flag check (aggregating voice capability)
  const voiceEnabled =
    entitlements?.some((e) => e.features?.voice_enabled === true) || false;

  return res.status(200).json({
    entitlements: entitlements || [],
    hasDurhamAccess,
    hasLnatAccess,
    voiceEnabled,
  });
}
