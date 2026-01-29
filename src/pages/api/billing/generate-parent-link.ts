// src/pages/api/billing/generate-parent-link.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerUser } from "@/lib/api/serverAuth";
import { nanoid } from "nanoid";

/**
 * Generate Parent Payment Link
 *
 * POST /api/billing/generate-parent-link
 * Body: { plan: 'core_monthly' | 'core_annual' | 'pro_monthly' | 'pro_annual' }
 *
 * Returns: { link: string, expires: string }
 *
 * Purpose: Allows Durham students to share a payment link with parents
 * who can then complete payment on the student's behalf
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Authenticate user
  const { user, supabase } = await getServerUser(req, res);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!supabase) {
    return res.status(500).json({ error: "Database connection failed" });
  }

  try {
    const { plan } = req.body;

    if (
      !plan ||
      !["core_monthly", "core_annual", "pro_monthly", "pro_annual"].includes(
        plan,
      )
    ) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    // Verify user has Durham email
    if (!user.email?.endsWith("@durham.ac.uk")) {
      return res.status(403).json({
        error:
          "Only Durham University students can generate parent payment links",
      });
    }

    // Generate unique payment token
    const paymentToken = nanoid(32);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Link valid for 7 days

    // Store payment intent in database
    const { data, error } = await supabase
      .from("parent_payment_links")
      .insert({
        user_id: user.id,
        student_email: user.email,
        plan: plan,
        payment_token: paymentToken,
        expires_at: expiresAt.toISOString(),
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("[Parent Link] Database error:", error);
      return res.status(500).json({ error: "Failed to generate payment link" });
    }

    // Generate shareable URL
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      `https://${req.headers.host}` ||
      "https://casewaylaw.ai";

    const paymentLink = `${origin}/parent-payment?token=${paymentToken}`;

    console.log("[Parent Link] Generated:", {
      userId: user.id,
      studentEmail: user.email,
      plan,
      token: paymentToken.substring(0, 8) + "...",
      expiresAt,
    });

    return res.status(200).json({
      success: true,
      link: paymentLink,
      expires: expiresAt.toISOString(),
      plan,
    });
  } catch (error: any) {
    console.error("[Parent Link] Unexpected error:", error);
    return res.status(500).json({
      error: "Failed to generate payment link",
      message: error.message || "Unknown error",
    });
  }
}
