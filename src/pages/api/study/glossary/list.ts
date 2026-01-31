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

    // LEXICON V1: Fetch from lexicon_master_terms (global + user terms)
    // Include user's stars/notes from lexicon_user_stars
    const { data, error } = await supabase
      .from("lexicon_master_terms")
      .select(
        `
        id,
        term,
        slug,
        area_of_law,
        priority,
        common_in_year,
        aliases,
        confusion_with,
        short_def,
        long_def,
        source,
        lecture_glossary_links (
          lecture_id,
          lectures (
            title
          )
        ),
        lexicon_user_stars!left (
          is_starred,
          personal_priority,
          notes
        )
      `,
      )
      .order("priority", { ascending: false })
      .order("term", { ascending: true });

    if (error) throw error;

    // Flatten and format results
    const results = (data || []).map((t: any) => {
      const userStar = t.lexicon_user_stars?.[0];
      return {
        id: t.id,
        term: t.term,
        slug: t.slug,
        definition: t.long_def || t.short_def || "",
        shortDef: t.short_def,
        areaOfLaw: t.area_of_law,
        priority: t.priority,
        commonInYear: t.common_in_year,
        aliases: t.aliases || [],
        confusionWith: t.confusion_with || [],
        source: t.source,
        isStarred: userStar?.is_starred || false,
        personalPriority: userStar?.personal_priority,
        userNotes: userStar?.notes,
        lectures: (t.lecture_glossary_links || []).map((l: any) => ({
          id: l.lecture_id,
          title: l.lectures?.title || "Unknown Lecture",
        })),
      };
    });

    return res.status(200).json(results);
  } catch (error: any) {
    console.error("[glossary/list] CRITICAL ERROR:", error);
    console.error("[glossary/list] Stack:", error.stack);
    return res.status(500).json({
      error: error.message || "Internal server error",
      details: error.toString(),
    });
  }
}
