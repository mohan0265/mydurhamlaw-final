import type { NextApiRequest, NextApiResponse } from "next";
import { parse } from "cookie";
import { createHmac, randomBytes } from "crypto";
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
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  // 1. Verify Admin Auth
  const token = parse(req.headers.cookie || "")[COOKIE_NAME];
  const exp = expectedToken();
  if (!token || !exp || token !== exp) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { requestId } = req.body;
  if (!requestId) return res.status(400).json({ error: "Missing requestId" });

  const adminClient = getSupabaseAdmin();
  if (!adminClient)
    return res.status(500).json({ error: "Server misconfigured" });

  try {
    // 2. Fetch Request
    const { data: request, error: fetchError } = await adminClient
      .from("access_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (fetchError || !request) {
      return res.status(404).json({ error: "Request not found" });
    }

    if (request.request_status !== "pending") {
      return res
        .status(400)
        .json({ error: `Request is already ${request.request_status}` });
    }

    // 3. Generate Invite (Duplicate logic from invite-student.ts, but cleaner reuse if possible. For now, inline.)
    // Check if invite exists already?
    const { data: existingInvites } = await adminClient
      .from("student_invitations")
      .select("*")
      .eq("email", request.email)
      .eq("status", "pending");

    let inviteToken: string;
    let inviteId: string;

    if (existingInvites && existingInvites.length > 0) {
      // Reuse existing invite if pending
      inviteToken = existingInvites[0].invite_token;
      inviteId = existingInvites[0].id;
    } else {
      // Create new invite
      inviteToken = randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const yearGroupMap: Record<string, string> = {
        foundation: "foundation",
        year1: "year1",
        year2: "year2",
        year3: "year3",
        alumni: "alumni", // Schema constraint might limit this? default to year3 logic or 'other'
        other: "foundation", // Safe default
      };

      const mappedYear = yearGroupMap[request.cohort] || "year1";

      const { data: invite, error: insertError } = await adminClient
        .from("student_invitations")
        .insert({
          email: request.email,
          display_name: request.name,
          year_group: mappedYear,
          invited_by: "admin_approval",
          invite_token: inviteToken,
          status: "pending",
          trial_days: 14,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (insertError) throw insertError;
      inviteId = invite.id;
    }

    // 4. Update Request Status
    const { error: updateError } = await adminClient
      .from("access_requests")
      .update({
        request_status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: (await adminClient.auth.getUser()).data.user?.id, // This might be null for service role, but acceptable
        decision_reason: "Manual Approval via Dashboard",
      })
      .eq("id", requestId);

    if (updateError) throw updateError;

    // 5. Return Invite Link
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "https://casewaylaw.ai";
    const inviteUrl = `${baseUrl}/invite/accept?token=${inviteToken}`;

    return res.status(200).json({
      success: true,
      inviteUrl,
      email: request.email,
    });
  } catch (error: any) {
    console.error("Approval Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
