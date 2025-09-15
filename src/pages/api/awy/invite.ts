import type { NextApiRequest, NextApiResponse } from "next";
import { getServerUser } from "@/lib/api/serverAuth";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  try {
    const { user } = await getServerUser(req, res);
    if (!user) {
      return res.status(401).json({ ok: false, error: "unauthenticated" });
    }

    const { email, relationship, displayName } = req.body || {};
    if (!email || !relationship) {
      return res.status(400).json({ ok: false, error: "Email and relationship are required" });
    }

    console.log(`[awy/invite] Processing invite for ${email} by student ${user.id}`);

    // 1. Check if connection already exists
    const { data: existingConnection } = await supabaseAdmin
      .from("awy_connections")
      .select("id, status")
      .eq("student_id", user.id)
      .eq("loved_email", email.toLowerCase())
      .single();

    if (existingConnection) {
      return res.status(409).json({ 
        ok: false, 
        error: "This loved one is already added" 
      });
    }

    let lovedUserId: string | null = null;

    // 2. Try to invite the loved one (create auth user)
    try {
      const invited = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { 
          role: "loved_one",
          invited_by: user.id,
          relationship: relationship
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=loved_one`
      });

      if (invited.data?.user?.id) {
        lovedUserId = invited.data.user.id;
        console.log(`[awy/invite] Successfully invited ${email}, user ID: ${lovedUserId}`);
      }
    } catch (inviteError: any) {
      console.log(`[awy/invite] Invite error: ${inviteError.message}`);
      
      // If user already exists, try to find them
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers.users?.find(u => u.email === email);
      if (existingUser) {
        lovedUserId = existingUser.id;
        console.log(`[awy/invite] Found existing user: ${lovedUserId}`);
      }
    }

    // 3. Create the connection
    const { data: connectionData, error: connectionError } = await supabaseAdmin
      .from("awy_connections")
      .insert({
        student_id: user.id,
        loved_email: email.toLowerCase(),
        relationship,
        display_name: displayName || null,
        loved_one_id: lovedUserId,
        status: lovedUserId ? "active" : "pending",
        is_visible: true,
      })
      .select("id")
      .single();

    if (connectionError) {
      console.error("[awy/invite] Connection creation error:", connectionError);
      throw connectionError;
    }

    // 4. Create profile for loved one
    if (lovedUserId) {
      await supabaseAdmin.from("profiles").upsert({
        id: lovedUserId,
        user_role: "loved_one",
        display_name: displayName || relationship,
        agreed_to_terms: true,
      }, { onConflict: "id" });

      // 5. Initialize presence for loved one
      await supabaseAdmin.from("awy_presence").upsert({
        user_id: lovedUserId,
        status: "offline",
        is_available_for_calls: true,
      }, { onConflict: "user_id" });
    }

    console.log(`[awy/invite] Connection created successfully: ${connectionData.id}`);

    return res.status(200).json({
      ok: true,
      connectionId: connectionData.id,
      lovedUserId,
      status: lovedUserId ? "active" : "pending",
      message: lovedUserId 
        ? `${email} can now login and will see you in their AWY widget` 
        : `Invitation sent to ${email}`
    });

  } catch (err: any) {
    console.error("[awy/invite] Fatal error:", err);
    return res.status(500).json({ 
      ok: false, 
      error: err?.message || "server_error" 
    });
  }
}
