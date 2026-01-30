// GET /api/lectures/get?id=...
// Returns a single lecture with transcript and notes
import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Lecture ID is required" });
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

    // Get lecture with transcript and notes
    const { data: lecture, error: lectureError } = await supabase
      .from("lectures")
      .select(
        `
        *,
        lecture_transcripts (transcript_text, word_count),
        lecture_notes (summary, key_points, discussion_topics, exam_prompts, glossary, engagement_hooks, exam_signals),
        academic_items (state)
      `,
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (lectureError || !lecture) {
      return res.status(404).json({ error: "Lecture not found" });
    }

    // Flatten the response
    const result = {
      ...lecture,
      transcript: Array.isArray(lecture.lecture_transcripts)
        ? lecture.lecture_transcripts[0]?.transcript_text
        : lecture.lecture_transcripts?.transcript_text || null,
      word_count: Array.isArray(lecture.lecture_transcripts)
        ? lecture.lecture_transcripts[0]?.word_count
        : lecture.lecture_transcripts?.word_count || null,
      notes: Array.isArray(lecture.lecture_notes)
        ? lecture.lecture_notes[0] || null
        : lecture.lecture_notes || null,
      // Extract progress from linked academic_item state if available
      progress: lecture.academic_items?.state?.progress
        ? Math.round((lecture.academic_items.state.progress as number) * 100)
        : 0,
    };
    delete result.lecture_transcripts;
    delete result.lecture_notes;
    delete result.academic_items;

    return res.status(200).json({ lecture: result });
  } catch (error: any) {
    console.error("[lectures/get] Error:", error);
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
}
