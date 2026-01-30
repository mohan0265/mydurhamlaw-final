import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { term, definition, source_reference, created_by_name } = req.body;
  if (!term || !definition) {
    return res.status(400).json({ error: "Term and definition are required" });
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

    const { data, error } = await supabase
      .from("glossary_terms")
      .upsert(
        {
          user_id: user.id,
          term,
          definition,
          source_reference,
          created_by_name,
          is_manual: true,
        },
        { onConflict: "user_id,term" },
      )
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error: any) {
    console.error("[glossary/add-manual] Error:", error);
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
}
