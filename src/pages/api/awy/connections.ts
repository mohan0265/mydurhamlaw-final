// src/pages/api/awy/connections.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerUser } from "@/lib/api/serverAuth"; // cookie-first + Bearer fallback
import { serverAWYService } from "@/lib/awy/awyService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Authenticate the request; works on Netlify using cookies OR Authorization: Bearer <token>
  const { user } = await getServerUser(req, res);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    switch (req.method) {
      case "GET": {
        // Get user's AWY connections
        const connections = await serverAWYService.getUserConnections(user.id);
        return res.status(200).json({ connections });
      }

      case "POST": {
        // Create new AWY connection
        const { connectionEmail, relationshipLabel, displayName } = req.body ?? {};

        if (!connectionEmail || !relationshipLabel) {
          return res
            .status(400)
            .json({ error: "Connection email and relationship label are required" });
        }

        const connectionId = await serverAWYService.createConnection(
          user.id,
          connectionEmail,
          relationshipLabel,
          displayName
        );

        return res.status(201).json({
          success: true,
          connectionId,
          message: "Connection created successfully",
        });
      }

      case "PUT": {
        // Update connection (permissions, etc.)
        const { connectionId, permissions } = req.body ?? {};

        if (!connectionId) {
          return res.status(400).json({ error: "Connection ID is required" });
        }

        if (permissions) {
          await serverAWYService.updateConnectionPermissions(connectionId, permissions);
          return res.status(200).json({
            success: true,
            message: "Connection permissions updated",
          });
        }

        return res.status(400).json({ error: "No valid update data provided" });
      }

      case "DELETE": {
        // Delete connection
        const { connectionId: deleteId } = req.body ?? {};
        // also accept ?id=... in query as a convenience
        const id =
          deleteId ?? (typeof req.query.id === "string" ? req.query.id : undefined);

        if (!id) {
          return res.status(400).json({ error: "Connection ID is required" });
        }

        await serverAWYService.deleteConnection(id);
        return res.status(200).json({
          success: true,
          message: "Connection deleted successfully",
        });
      }

      default: {
        res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
        return res.status(405).json({ error: "Method not allowed" });
      }
    }
  } catch (error: any) {
    console.error("AWY Connections API error:", error);
    return res.status(500).json({
      error: error?.message || "Internal server error",
    });
  }
}
