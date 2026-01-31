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

    // Fetch terms with their links to lectures
    const { data, error } = await supabase
      .from("glossary_terms")
      .select(
        `
        id,
        term,
        definition,
        source_reference,
        is_manual,
        importance_level,
        lecture_glossary_links (
          lecture_id,
          lectures (
            title
          )
        )
      `,
      )
      .eq("user_id", user.id)
      .order("importance_level", { ascending: false })
      .order("term", { ascending: true });

    if (error) throw error;

    // Flatten links for easier consumption
    const results = (data || []).map((t: any) => ({
      id: t.id,
      term: t.term,
      definition: t.definition,
      source_reference: t.source_reference,
      is_manual: t.is_manual,
      importance_level: t.importance_level || 0,
      created_by_name: t.created_by_name,
      lectures: (t.lecture_glossary_links || []).map((l: any) => ({
        id: l.lecture_id,
        title: l.lectures?.title || "Unknown Lecture",
      })),
    }));

    return res.status(200).json(results);
  } catch (error: any) {
    console.error("[glossary/list] CRITICAL ERROR:", error);
    console.error("[glossary/list] Stack:", error.stack);
    return res
      .status(500)
      .json({
        error: error.message || "Internal server error",
        details: error.toString(),
      });
  }
}
