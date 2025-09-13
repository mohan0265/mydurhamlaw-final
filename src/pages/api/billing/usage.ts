// src/pages/api/billing/usage.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerUser } from "@/lib/api/serverAuth"; // cookie-first + Bearer fallback
import { serverSubscriptionService } from "@/lib/billing/subscriptionService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Authenticate (works on Netlify using cookies OR Authorization: Bearer <token>)
  const { user } = await getServerUser(req, res);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    switch (req.method) {
      case "GET": {
        // Get user's usage data
        const raw = Array.isArray(req.query.feature_type)
          ? req.query.feature_type[0]
          : (req.query.feature_type as string | undefined);

        const usage = await serverSubscriptionService.getUserUsage(user.id, raw);
        return res.status(200).json({ usage });
      }

      case "POST": {
        // Track usage
        const {
          featureType,
          usageCount = 1,
          metadata = {},
        }: { featureType?: string; usageCount?: number; metadata?: Record<string, any> } =
          (req.body as any) || {};

        if (!featureType) {
          return res.status(400).json({ error: "Feature type is required" });
        }

        const count = Number.isFinite(usageCount as number)
          ? Number(usageCount)
          : 1;

        await serverSubscriptionService.trackUsage(user.id, featureType, count, metadata ?? {});
        return res.status(200).json({
          success: true,
          message: "Usage tracked successfully",
        });
      }

      default: {
        res.setHeader("Allow", ["GET", "POST"]);
        return res.status(405).json({ error: "Method not allowed" });
      }
    }
  } catch (error: any) {
    console.error("Usage API error:", error);
    return res.status(500).json({
      error: error?.message || "Internal server error",
    });
  }
}
