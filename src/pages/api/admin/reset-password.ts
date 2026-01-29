import type { NextApiRequest, NextApiResponse } from "next";
import { parse } from "cookie";
import { createHmac } from "crypto";
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";

const COOKIE_NAME = "admin_session";

function expectedToken() {
  const adminUser = process.env.ADMIN_USERNAME;
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminUser || !adminPass) return null;
  return createHmac("sha256", adminPass).update(adminUser).digest("hex");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Check admin auth
  const token = parse(req.headers.cookie || "")[COOKIE_NAME];
  const exp = expectedToken();
  if (!token || !exp || token !== exp) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const adminClient = getSupabaseAdmin();
  if (!adminClient) {
    return res.status(500).json({ error: "Server misconfigured" });
  }

  const { userId, email } = req.body;

  if (!userId || !email) {
    return res.status(400).json({ error: "Missing userId or email" });
  }

  try {
    // Use Supabase Admin to send password reset
    const { error } = await adminClient.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "https://casewaylaw.ai"}/auth/reset-password`,
      },
    });

    if (error) {
      // If generateLink fails, try the simpler resetPasswordForEmail
      const { error: resetError } =
        await adminClient.auth.resetPasswordForEmail(email, {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "https://casewaylaw.ai"}/auth/reset-password`,
        });

      if (resetError) {
        throw resetError;
      }
    }

    return res.status(200).json({
      success: true,
      message: `Password reset email sent to ${email}`,
    });
  } catch (error: any) {
    console.error("Reset password error:", error);

    // Check if it's a test email that can't receive real emails
    if (email.includes("@test.caseway.local")) {
      // For test accounts, just reset the password directly to default
      try {
        const { error: updateError } =
          await adminClient.auth.admin.updateUserById(userId, {
            password: "TestPass123!",
          });

        if (updateError) throw updateError;

        return res.status(200).json({
          success: true,
          message: `Password reset to default (TestPass123!) for test account ${email}`,
        });
      } catch (directResetError) {
        console.error("Direct reset error:", directResetError);
      }
    }

    return res
      .status(500)
      .json({ error: error.message || "Failed to reset password" });
  }
}
