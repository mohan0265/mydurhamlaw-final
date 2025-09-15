// src/pages/api/awy/presence.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerUser } from "@/lib/api/serverAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  try {
    const { user } = await getServerUser(req, res);
    if (!user) return res.status(401).json({ ok: false, error: "unauthenticated" });

    // For now, return a mock presence status
    // You can implement real-time presence later with Supabase Realtime
    const mockPresence = {
      // Add your loved ones' emails here with their status
      // This is a placeholder implementation
    };

    return res.status(200).json(mockPresence);
  } catch (err: any) {
    console.error("[awy/presence] error:", err);
    return res.status(500).json({ ok: false, error: err?.message || "server_error" });
  }
}
