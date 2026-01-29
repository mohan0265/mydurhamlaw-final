// API Route: Create Test Student Account
import type { NextApiRequest, NextApiResponse } from "next";
import { parse } from "cookie";
import { createHmac, randomBytes } from "crypto";
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";
import type {
  CreateTestStudentRequest,
  CreateTestStudentResponse,
} from "@/types/admin";

const COOKIE_NAME = "admin_session";

function expectedToken() {
  const adminUser = process.env.ADMIN_USERNAME;
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminUser || !adminPass) return null;
  return createHmac("sha256", adminPass).update(adminUser).digest("hex");
}

// Generate a valid fake email for non-email test IDs
function generateTestEmail(identifier: string): string {
  const slug = identifier
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 30);
  const random = randomBytes(4).toString("hex");
  return `${slug}_${random}@test.caseway.local`;
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

  const {
    email: inputIdentifier,
    displayName,
    yearGroup,
    password,
    isTest,
  }: CreateTestStudentRequest = req.body;

  if (!inputIdentifier || !displayName || !yearGroup) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Support non-email identifiers by auto-generating fake email
  const isRealEmail = inputIdentifier.includes("@");
  const email = isRealEmail
    ? inputIdentifier
    : generateTestEmail(inputIdentifier);
  const actualDisplayName = displayName || inputIdentifier;

  try {
    // 1. Create auth user
    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser({
        email,
        password: password || "TestPass123!",
        email_confirm: true,
        user_metadata: {
          display_name: actualDisplayName,
          is_test_account: isTest !== undefined ? isTest : true,
          original_identifier: inputIdentifier,
        },
      });

    if (authError || !authData.user) {
      return res
        .status(400)
        .json({ error: authError?.message || "Failed to create auth user" });
    }

    const userId = authData.user.id;

    // 2. Calculate trial end (30 days from now)
    const now = new Date();
    const trialEnds = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // 4. Create profile with trial
    const { data: profileData, error: profileError } = await adminClient
      .from("profiles")
      .upsert({
        id: userId, // profiles table uses 'id' not 'user_id'
        display_name: actualDisplayName,
        user_role: "student",
        year_group: yearGroup,
        year_of_study: yearGroup,
        is_test_account: isTest !== undefined ? isTest : true,
        trial_started_at: now.toISOString(),
        trial_ends_at: trialEnds.toISOString(),
        trial_ever_used: true,
        subscription_status: "trial",
      })
      .select()
      .single();

    if (profileError) {
      // Rollback: delete auth user
      await adminClient.auth.admin.deleteUser(userId);
      return res.status(400).json({ error: profileError.message });
    }

    const response: CreateTestStudentResponse = {
      userId,
      profileId: profileData.id,
      email,
      trialEndsAt: trialEnds.toISOString(),
    };

    return res.status(200).json(response);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
}
