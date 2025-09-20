import type { NextApiRequest, NextApiResponse } from "next";
import { getServerUser } from "@/lib/server/auth";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";

type Json = Record<string, unknown>;

function ok<T extends Json>(res: NextApiResponse, body: T) {
  return res.status(200).json({ ok: true, ...body });
}

function failSoft<T extends Json>(res: NextApiResponse, body: T, warn: unknown) {
  const message = (warn as any)?.message ?? warn;
  console.warn("[awy] soft-fail:", message);
  return res.status(200).json({ ok: true, ...body });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const { user } = await getServerUser(req, res);
  if (!user) {
    console.log("[awy/calls] No authenticated user");
    return res.status(401).json({ ok: false, error: "unauthenticated" });
  }

  const { email } = (req.body as { email?: string }) || {};
  if (!email) {
    return res.status(400).json({ ok: false, error: "email_required" });
  }

  const callId = 'call_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
  const roomUrl = '/call/' + callId;

  try {
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
    } catch (dbError: any) {
      console.warn("[awy/calls] call record insert skipped:", dbError);
    }

    return ok(res, {
      callId,
      roomUrl,
      url: roomUrl,
    });
  } catch (err: any) {
    return failSoft(res, {
      callId,
      roomUrl,
      url: roomUrl,
    }, err);
  }
}
