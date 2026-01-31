import { NextApiRequest, NextApiResponse } from "next";
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";
import { isAuthenticatedAdmin } from "@/lib/server/adminAuth";
import { stripe } from "@/lib/stripe";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  // 1. Verify Admin
  if (!isAuthenticatedAdmin(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { subscriptionId, mode } = req.body; // mode: 'immediate' | 'period_end'
  if (!subscriptionId) {
    return res.status(400).json({ error: "Missing subscriptionId" });
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return res.status(500).json({ error: "Server error" });

  try {
    if (mode === "immediate") {
      await stripe.subscriptions.cancel(subscriptionId);
    } else {
      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    }

    // Log to Admin Audit Log
    // Since we don't know *which* admin user (cookie doesn't have ID, just auth),
    // we log as 'system' or 'admin@caseway.ai' (placeholder).
    // Or we can parse the cookie if it stored email? Use env var.

    // We'll skip complex auditing for now or log generic.
    await supabaseAdmin.from("admin_audit_log").insert({
      action: "ADMIN_CANCEL_SUBSCRIPTION",
      metadata: { subscriptionId, mode },
      // admin_user_id is hard to get without a full session, defaulting to null implies System/SuperAdmin
    });

    res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("Admin cancel error:", err);
    res.status(500).json({ error: err.message });
  }
}
