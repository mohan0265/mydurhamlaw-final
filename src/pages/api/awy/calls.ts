// src/pages/api/awy/calls.ts
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
    if (!user) return res.status(401).json({ ok: false, error: "unauthenticated" });

    const { email } = (req.body as { email?: string }) || {};
    if (!email) return res.status(400).json({ ok: false, error: "invalid_request" });

    // Create a call record in the database
    const { data: callData, error: callError } = await supabaseAdmin
      .from("awy_calls")
      .insert({
        student_id: user.id,
        loved_email: email,
        status: "initiated",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (callError) throw callError;

    // For now, return a simple room URL
    // You can integrate with services like Jitsi, Zoom, or custom WebRTC later
    const roomUrl = `/call/${callData.id}`;

    return res.status(200).json({
      ok: true,
      callId: callData.id,
      roomUrl,
      url: roomUrl,
    });
  } catch (err: any) {
    console.error("[awy/calls] error:", err);
    return res.status(500).json({ ok: false, error: err?.message || "server_error" });
  }
}
