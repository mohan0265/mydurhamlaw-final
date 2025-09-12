// src/pages/api/billing/subscription.ts
import { NextApiRequest, NextApiResponse } from "next";
import { getServerUser } from "@/lib/api/serverAuth"; // <-- cookie OR Bearer fallback
import { serverSubscriptionService } from "@/lib/billing/subscriptionService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // NEW: authenticate using cookie-first, then Bearer token fallback
  const { supabase, user } = await getServerUser(req, res);

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    switch (req.method) {
      case "GET": {
        // Get user's subscription info
        const subscriptionInfo = await serverSubscriptionService.getUserSubscriptionInfo(user.id);
        return res.status(200).json({ subscription: subscriptionInfo });
      }

      case "POST": {
        // Start trial or create subscription
        const { action, planId } = req.body;

        if (action === "start_trial") {
          const subscriptionId = await serverSubscriptionService.startUserTrial(user.id);
          return res.status(200).json({
            success: true,
            subscriptionId,
            message: "Trial started successfully",
          });
        }

        // If you later support creating a sub directly from here, you can use planId.
        // e.g., if (action === "create_subscription") { ... }

        return res.status(400).json({ error: "Invalid action" });
      }

      case "PUT": {
        // Update subscription (cancel, reactivate, etc.)
        const { updateAction } = req.body;

        if (updateAction === "cancel") {
          await serverSubscriptionService.cancelSubscription(user.id);
          return res.status(200).json({
            success: true,
            message: "Subscription cancelled successfully",
          });
        }

        if (updateAction === "reactivate") {
          await serverSubscriptionService.reactivateSubscription(user.id);
          return res.status(200).json({
            success: true,
            message: "Subscription reactivated successfully",
          });
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
    return res.status(500).json({
      error: error?.message || "Internal server error",
    });
  }
}
