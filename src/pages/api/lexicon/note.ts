import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";

/**
 * Save user note to lexicon_user_stars
 */
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

    const { termId, notes } = req.body;

    if (!termId) {
      return res.status(400).json({ error: "termId is required" });
    }

    // Upsert to lexicon_user_stars
    const { error } = await supabase.from("lexicon_user_stars").upsert(
      {
        user_id: user.id,
        term_id: termId,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,term_id",
      },
    );

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("[lexicon/note] Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
