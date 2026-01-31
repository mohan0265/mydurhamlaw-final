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

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return res.status(500).json({ error: "Server error" });

  try {
    // Lookup Customer ID
    const { data: billingCust } = await supabaseAdmin
      .from("billing_customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (!billingCust?.stripe_customer_id) {
      return res
        .status(404)
        .json({ error: "No billing account found. Please subscribe first." });
    }

    // Create Portal Session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: billingCust.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.URL || "http://localhost:3000"}/billing`,
    });

    res.status(200).json({ url: portalSession.url });
  } catch (err: any) {
    console.error("Portal error:", err);
    res.status(500).json({ error: err.message });
  }
}
