import type { NextApiRequest, NextApiResponse } from "next";
import { getServerUser } from "@/lib/api/serverAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  try {
    const { user } = await getServerUser(req, res);
    if (!user) {
      console.log("[awy/presence] No authenticated user");
      return res.status(401).json({ ok: false, error: "unauthenticated" });
    }

    // Simple mock presence for now - you can enhance this later with real-time data
    const mockPresence: Record<string, string> = {
      "cmcolonaive@gmail.com": "online",
      // Add more emails as needed based on your connections
    };

    return res.status(200).json(mockPresence);
  } catch (err: any) {
    console.error("[awy/presence] Fatal error:", err);
    return res.status(500).json({ 
      ok: false, 
      error: err?.message || "server_error" 
    });
  }
}
