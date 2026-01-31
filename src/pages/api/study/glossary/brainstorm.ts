import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabase = createPagesServerClient({ req, res });
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Fetch up to 50 terms, prioritized by importance
    // We want a mix of high importance and random terms
    const { data: terms, error } = await supabase
      .from("glossary_terms")
      .select("id, term, definition, importance_level")
      .eq("user_id", user.id)
      .order("importance_level", { ascending: false })
      .order("id", { ascending: false })
      .limit(50);

    if (error) throw error;

    if (!terms || terms.length === 0) {
      return res.status(200).json([]);
    }

    // Weighted selection in JS:
    // Important terms (level > 0) get more "tickets" in the raffle
    const weightedPool: any[] = [];
    terms.forEach((t) => {
      const weight = (t.importance_level || 0) + 1;
      // Add multiple copies to the pool based on weight
      for (let i = 0; i < weight; i++) {
        weightedPool.push(t);
      }
    });

    // Shuffle and pick 10 unique terms if possible
    const results: any[] = [];
    const usedIds = new Set();

    // Simple shuffle of the weighted pool
    const shuffled = weightedPool.sort(() => Math.random() - 0.5);

    for (const item of shuffled) {
      if (!usedIds.has(item.id)) {
        results.push(item);
        usedIds.add(item.id);
      }
      if (results.length >= 10) break;
    }

    return res.status(200).json(results);
  } catch (error: any) {
    console.error("[glossary/brainstorm] Error:", error);
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
}
