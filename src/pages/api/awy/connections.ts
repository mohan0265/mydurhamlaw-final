// src/pages/api/awy/connections.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerUser } from "@/lib/api/serverAuth"; // cookie-first + Bearer fallback
import { serverAWYService } from "@/lib/awy/awyService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user } = await getServerUser(req, res);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  try {
    switch (req.method) {
      case "GET": {
        try {
          const connections = await serverAWYService.getUserConnections(user.id);
          return res.status(200).json({ connections });
        } catch (e: any) {
          console.error("[awy/connections][GET] service error:", e);
          return res.status(500).json({ error: e?.message || "service_error" });
        }
      }

      case "POST": {
        // Accept both naming styles:
        // - { connectionEmail, relationshipLabel, displayName }
        // - { email, relationship, display_name }
        const body = (req.body as any) || {};
        const connectionEmail = body.connectionEmail || body.email;
        const relationshipLabel = body.relationshipLabel || body.relationship;
        const displayName =
          body.displayName ?? body.display_name ?? null;

        if (!connectionEmail || !relationshipLabel) {
          return res
            .status(400)
            .json({ error: "Connection email and relationship label are required" });
        }

        try {
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
        } catch (e: any) {
          console.error("[awy/connections][POST] service error:", e);
          return res.status(500).json({ error: e?.message || "service_error" });
        }
      }

      case "PUT": {
        const { connectionId, permissions } = (req.body as any) || {};
        if (!connectionId) {
          return res.status(400).json({ error: "Connection ID is required" });
        }
        try {
          if (permissions) {
            await serverAWYService.updateConnectionPermissions(connectionId, permissions);
            return res.status(200).json({
              success: true,
              message: "Connection permissions updated",
            });
          }
          return res.status(400).json({ error: "No valid update data provided" });
        } catch (e: any) {
          console.error("[awy/connections][PUT] service error:", e);
          return res.status(500).json({ error: e?.message || "service_error" });
        }
      }

      case "DELETE": {
        const body = (req.body as any) || {};
        const id =
          body.connectionId ||
          body.id ||
          (typeof req.query.id === "string" ? req.query.id : undefined);

        if (!id) {
          return res.status(400).json({ error: "Connection ID is required" });
        }
        try {
          await serverAWYService.deleteConnection(id);
          return res.status(200).json({
            success: true,
            message: "Connection deleted successfully",
          });
        } catch (e: any) {
          console.error("[awy/connections][DELETE] service error:", e);
          return res.status(500).json({ error: e?.message || "service_error" });
        }
      }

      default: {
        res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
        return res.status(405).json({ error: "Method not allowed" });
      }
    }
  } catch (error: any) {
    console.error("[awy/connections] unhandled error:", error);
    return res.status(500).json({ error: error?.message || "Internal server error" });
  }
}
