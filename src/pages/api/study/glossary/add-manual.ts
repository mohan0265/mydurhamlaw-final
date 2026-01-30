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
          term: term.trim(),
          definition: definition.trim(),
          source_reference: source_reference || "Manual Lookup",
          created_by_name: created_by_name || "Student",
          is_manual: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,term" },
      )
      .select()
      .single();

    if (error) {
      console.error("[glossary/add-manual] Supabase Error:", error);
      throw error;
    }

    return res.status(200).json(data);
  } catch (error: any) {
    console.error("[glossary/add-manual] Catch Error:", error);
    return res.status(500).json({
      error: error.message || "Internal server error",
      details: error.details || error.hint || null,
      code: error.code || null,
    });
  }
}
