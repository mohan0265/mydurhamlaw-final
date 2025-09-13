// src/pages/api/awy/interactions.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerUser } from "@/lib/api/serverAuth"; // cookie-first + Bearer fallback
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
        // Get recent interactions
        const qLimit = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
        const limit = Number.parseInt((qLimit as string) ?? "20", 10) || 20;

        const interactions = await serverAWYService.getRecentInteractions(user.id, limit);
        return res.status(200).json({ interactions });
      }

      case "POST": {
        // Send new interaction
        const { connectionId, interactionType, message } = req.body ?? {};

        if (!connectionId || !interactionType) {
          return res
            .status(400)
            .json({ error: "Connection ID and interaction type are required" });
        }

        const interactionId = await serverAWYService.sendInteraction(
          user.id,
          connectionId,
          interactionType,
          message
        );

        return res.status(201).json({
          success: true,
          interactionId,
          message: "Interaction sent successfully",
        });
      }

      case "PUT": {
        // Mark interaction as read
        const { interactionId: readId } = req.body ?? {};
        if (!readId) {
          return res.status(400).json({ error: "Interaction ID is required" });
        }

        await serverAWYService.markInteractionAsRead(readId);
        return res.status(200).json({
          success: true,
          message: "Interaction marked as read",
        });
      }

      default: {
        res.setHeader("Allow", ["GET", "POST", "PUT"]);
        return res.status(405).json({ error: "Method not allowed" });
      }
    }
  } catch (error: any) {
    console.error("AWY Interactions API error:", error);
    return res.status(500).json({
      error: error?.message || "Internal server error",
    });
  }
}
