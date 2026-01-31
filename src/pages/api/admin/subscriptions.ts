import { NextApiRequest, NextApiResponse } from "next";
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedAdmin } from "@/lib/server/adminAuth";

// Secure endpoint: only admin
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end("Method Not Allowed");
  }

  // 1. Verify Admin (Cookie based)
  if (!isAuthenticatedAdmin(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // 2. Fetch Subscriptions
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return res.status(500).json({ error: "Server error" });

  // 2. Fetch Subscriptions with User Email
  // Join billing_subscriptions with profiles (for email/name)
  const { data: subscriptions, error } = await supabaseAdmin
    .from("billing_subscriptions")
    .select(
      `
        *,
        profiles:user_id (email, display_name, role)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(200).json({ subscriptions });
}
