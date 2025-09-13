import type { NextApiRequest, NextApiResponse } from "next";
import { getServerUser } from "@/lib/api/serverAuth";
import { serverSubscriptionService } from "@/lib/billing/subscriptionService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Try to auth; if no user, return a safe default instead of 401
  const { user } = await getServerUser(req, res);

  try {
    switch (req.method) {
      case "GET": {
        if (!user) {
          // harmless default so the widget/UI can render without errors
          return res.status(200).json({
            subscription: {
              tier: "free",
              inTrial: false,
              trialEndsAt: null,
              status: "inactive",
            },
          });
        }
        const subscriptionInfo = await serverSubscriptionService.getUserSubscriptionInfo(user.id);
        return res.status(200).json({ subscription: subscriptionInfo });
      }

      case "POST": {
        if (!user) return res.status(401).json({ error: "Unauthorized" });
        const { action } = req.body ?? {};
        if (action === "start_trial") {
          const subscriptionId = await serverSubscriptionService.startUserTrial(user.id);
          return res.status(200).json({
            success: true,
            subscriptionId,
            message: "Trial started successfully",
          });
        }
        return res.status(400).json({ error: "Invalid action" });
      }

      case "PUT": {
        if (!user) return res.status(401).json({ error: "Unauthorized" });
        const { updateAction } = req.body ?? {};
        if (updateAction === "cancel") {
          await serverSubscriptionService.cancelSubscription(user.id);
          return res.status(200).json({ success: true, message: "Subscription cancelled successfully" });
        }
        if (updateAction === "reactivate") {
          await serverSubscriptionService.reactivateSubscription(user.id);
          return res.status(200).json({ success: true, message: "Subscription reactivated successfully" });
        }
        return res.status(400).json({ error: "Invalid update action" });
      }

      default: {
        res.setHeader("Allow", ["GET", "POST", "PUT"]);
        return res.status(405).json({ error: "Method not allowed" });
      }
    }
  } catch (error: any) {
    console.error("Subscription API error:", error);
    return res.status(500).json({ error: error?.message || "Internal server error" });
  }
}
