// src/pages/api/awy/presence.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerUser } from "@/lib/api/serverAuth"; // cookie-first + Bearer token fallback
import { serverAWYService } from "@/lib/awy/awyService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Authenticate (works on Netlify using cookies OR Authorization: Bearer <token>)
  const { user } = await getServerUser(req, res);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    switch (req.method) {
      case "GET": {
        // Get presence data for user's connections
        const presenceData = await serverAWYService.getPresenceForConnections(user.id);
        return res.status(200).json({ presence: presenceData });
      }

      case "POST": {
        // Update user's presence
        const presenceUpdate = (req.body as Record<string, any>) ?? {};
        await serverAWYService.updatePresence(user.id, presenceUpdate);
        return res.status(200).json({
          success: true,
          message: "Presence updated successfully",
        });
      }

      default: {
        res.setHeader("Allow", ["GET", "POST"]);
        return res.status(405).json({ error: "Method not allowed" });
      }
    }
  } catch (error: any) {
    console.error("AWY Presence API error:", error);
    return res.status(500).json({
      error: error?.message || "Internal server error",
    });
  }
}
