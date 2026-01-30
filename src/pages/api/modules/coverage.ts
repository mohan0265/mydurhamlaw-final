import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const supabase = createPagesServerClient({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { moduleId } = req.query;

  try {
    if (!moduleId) {
      // List all rollups for this user
      const { data: rollups } = await supabase
        .from("module_coverage_rollups")
        .select("*, module_catalog(title, code)")
        .eq("user_id", session.user.id);

      return res.status(200).json(rollups || []);
    }

    if (typeof moduleId !== "string") {
      return res.status(400).json({ error: "Invalid moduleId" });
    }
    // 1. Fetch existing rollup
    let { data: rollup, error } = await supabase
      .from("module_coverage_rollups")
      .select("*")
      .eq("module_id", moduleId)
      .eq("user_id", session.user.id)
      .maybeSingle();

    // 2. If missing or older than 5 minutes, we could recompute here (simplified for now)
    // For this implementation, we rely on the background worker to keep it fresh
    // But we'll return a default if it doesn't exist yet
    if (!rollup) {
      // Fetch total topics to see if shield is enabled
      const { count } = await supabase
        .from("module_topics")
        .select("*", { count: "exact", head: true })
        .eq("module_id", moduleId)
        .eq("user_id", session.user.id);

      return res.status(200).json({
        total_topics: count || 0,
        covered_topics: 0,
        coverage_pct: 0,
        missing_topics: [],
        missing_high_importance: [],
        is_new: true,
      });
    }

    return res.status(200).json(rollup);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch coverage" });
  }
}
