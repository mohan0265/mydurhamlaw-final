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
      console.log("[awy/invite] No user found");
      return res.status(401).json({ ok: false, error: "unauthenticated" });
    }

    const { email, relationship, displayName } = req.body || {};
    if (!email || !relationship) {
      console.log("[awy/invite] Missing email or relationship");
      return res.status(400).json({ ok: false, error: "invalid_request" });
    }

    console.log(`[awy/invite] Processing invite for ${email} by user ${user.id}`);

    let lovedUserId: string | null = null;

    // 1) Try to invite the user
    try {
      const invited = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { role: "loved_one" },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://mydurhamlaw-final.netlify.app'}/auth/callback`
      });

      if (!invited.error && invited.data?.user?.id) {
        lovedUserId = invited.data.user.id;
        console.log(`[awy/invite] Successfully invited ${email}, user ID: ${lovedUserId}`);
      }
    } catch (inviteError: any) {
      console.log(`[awy/invite] Invite error (expected if user exists): ${inviteError.message}`);
      // User might already exist, continue with connection creation
    }

    // 2) If invite failed, try to get existing user
    if (!lovedUserId) {
      try {
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers.users?.find(u => u.email === email);
        if (existingUser) {
          lovedUserId = existingUser.id;
          console.log(`[awy/invite] Found existing user: ${lovedUserId}`);
        }
      } catch (e) {
        console.log(`[awy/invite] Could not find existing user: ${e}`);
      }
    }

    // 3) Create the connection
    const connectionData = {
      student_id: user.id,
      loved_email: email.toLowerCase(),
      relationship,
      display_name: displayName || null,
      loved_one_id: lovedUserId,
      loved_is_user: lovedUserId ? true : null,
      status: lovedUserId ? "active" : "pending",
      is_visible: true,
    };

    console.log(`[awy/invite] Creating connection:`, connectionData);

    const { data: upsertData, error: upsertError } = await supabaseAdmin
      .from("awy_connections")
      .upsert(connectionData, { 
        onConflict: "student_id,loved_email",
        ignoreDuplicates: false 
      })
      .select("id,loved_one_id")
      .single();

    if (upsertError) {
      console.error("[awy/invite] Upsert error:", upsertError);
      throw upsertError;
    }

    console.log(`[awy/invite] Connection created/updated:`, upsertData);

    // 4) Create profile for loved one if they exist as a user
    if (lovedUserId) {
      try {
        await supabaseAdmin.from("profiles").upsert(
          { 
            id: lovedUserId, 
            user_role: "loved_one", 
            agreed_to_terms: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          { onConflict: "id", ignoreDuplicates: true }
        );
        console.log(`[awy/invite] Profile created for loved one: ${lovedUserId}`);
      } catch (profileError) {
        console.log(`[awy/invite] Profile creation non-fatal error:`, profileError);
        // Non-fatal, connection still works
      }
    }

    return res.status(200).json({
      ok: true,
      connectionId: upsertData?.id,
      lovedUserId,
      status: lovedUserId ? "active" : "pending",
      message: `Successfully ${lovedUserId ? 'connected to' : 'invited'} ${email}`
    });

  } catch (err: any) {
    console.error("[awy/invite] Fatal error:", err);
    return res.status(500).json({ 
      ok: false, 
      error: err?.message || "server_error",
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}
