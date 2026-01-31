import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const supabase = createPagesServerClient({ req, res });
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    const { termId } = req.query;
    if (!termId) return res.status(400).json({ error: "termId missing" });

    try {
      const { data, error } = await supabase
        .from("glossary_user_notes")
        .select("notes")
        .eq("user_id", user.id)
        .eq("term_id", termId)
        .maybeSingle();

      if (error) throw error;
      return res.status(200).json({ notes: data?.notes || "" });
    } catch (error: any) {
      console.error("[glossary/notes] GET Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === "POST") {
    const { termId, notes } = req.body;
    if (!termId) return res.status(400).json({ error: "termId missing" });

    try {
      const { data, error } = await supabase
        .from("glossary_user_notes")
        .upsert(
          {
            user_id: user.id,
            term_id: termId,
            notes: notes,
          },
          {
            onConflict: "user_id, term_id",
          },
        )
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    } catch (error: any) {
      console.error("[glossary/notes] POST Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
