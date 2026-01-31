import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
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

    const { termId, importanceLevel } = req.body;

    if (!termId) {
      return res.status(400).json({ error: "termId is required" });
    }

    const { data, error } = await supabase
      .from("glossary_terms")
      .update({
        importance_level: importanceLevel || 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", termId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error: any) {
    console.error("[glossary/rank] Error:", error);
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
}
