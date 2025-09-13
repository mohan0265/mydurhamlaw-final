// src/pages/api/awy/notifications.ts
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
        // Get user's notifications
        const raw = Array.isArray(req.query.unread_only)
          ? req.query.unread_only[0]
          : (req.query.unread_only as string | undefined);

        const unreadOnly = (raw ?? "false").toLowerCase() === "true";

        const notifications = await serverAWYService.getUserNotifications(
          user.id,
          unreadOnly
        );
        return res.status(200).json({ notifications });
      }

      case "PUT": {
        // Mark notification(s) as read
        const { notificationId, markAllAsRead } =
          (req.body as { notificationId?: string; markAllAsRead?: boolean }) || {};

        if (markAllAsRead) {
          await serverAWYService.markAllNotificationsAsRead(user.id);
          return res.status(200).json({
            success: true,
            message: "All notifications marked as read",
          });
        }

        if (notificationId) {
          await serverAWYService.markNotificationAsRead(notificationId);
          return res.status(200).json({
            success: true,
            message: "Notification marked as read",
          });
        }

        return res
          .status(400)
          .json({ error: "Either notificationId or markAllAsRead must be provided" });
      }

      default: {
        res.setHeader("Allow", ["GET", "PUT"]);
        return res.status(405).json({ error: "Method not allowed" });
      }
    }
  } catch (error: any) {
    console.error("AWY Notifications API error:", error);
    return res.status(500).json({
      error: error?.message || "Internal server error",
    });
  }
}
