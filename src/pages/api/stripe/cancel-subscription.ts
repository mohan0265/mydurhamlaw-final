import { NextApiRequest, NextApiResponse } from "next";
import { stripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";
import { createClient } from "@supabase/supabase-js";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  // Auth User
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: req.headers.authorization! } } },
  );
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { mode } = req.body; // 'period_end' | 'immediate' (admin only?)
  // For user facing, default to period_end

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return res.status(500).json({ error: "Server error" });

  try {
    // Find active subscription
    const { data: sub } = await supabaseAdmin
      .from("billing_subscriptions")
      .select("stripe_subscription_id, status")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing", "past_due"])
      .single();

    if (!sub) {
      return res.status(404).json({ error: "No active subscription found." });
    }

    if (mode === "immediate") {
      // Caution: usually admin only
      await stripe.subscriptions.cancel(sub.stripe_subscription_id);
    } else {
      // Default: Period End
      await stripe.subscriptions.update(sub.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
    }

    // Audit Log (Using admin audit log if we want, or just webhook events)
    // Let's create an admin_audit_log entry for tracking (even if user initiated)
    await supabaseAdmin.from("admin_audit_log").insert({
      admin_user_id: user.id, // Self-action
      action: "USER_CANCEL_SUBSCRIPTION",
      target_user_id: user.id,
      metadata: {
        mode: mode || "period_end",
        subscriptionId: sub.stripe_subscription_id,
      },
    });

    res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("Cancellation error:", err);
    res.status(500).json({ error: err.message });
  }
}
