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
      console.log("[awy/calls] No authenticated user");
      return res.status(401).json({ ok: false, error: "unauthenticated" });
    }

    const { email } = (req.body as { email?: string }) || {};
    if (!email) {
      return res.status(400).json({ ok: false, error: "Email is required" });
    }

    // For now, just create a simple call record
    // You can integrate with WebRTC, Jitsi, or other video call services later
    const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create call record in database (optional)
    try {
      await supabaseAdmin
        .from("awy_calls")
        .insert({
          id: callId,
          student_id: user.id,
          loved_email: email,
          status: "initiated",
          created_at: new Date().toISOString(),
        });
    } catch (dbError) {
      // Don't fail if call record creation fails
      console.warn("[awy/calls] Could not create call record:", dbError);
    }

    // Return a simple room URL - you can customize this
    const roomUrl = `/call/${callId}`;

    return res.status(200).json({
      ok: true,
      callId,
      roomUrl,
      url: roomUrl,
    });
  } catch (err: any) {
    console.error("[awy/calls] Fatal error:", err);
    return res.status(500).json({ 
      ok: false, 
      error: err?.message || "server_error" 
    });
  }
}
