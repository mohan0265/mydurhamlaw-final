import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import type { NextApiRequest, NextApiResponse } from "next";

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

    const {
      title,
      module_code,
      module_name,
      lecturer_name,
      user_module_id,
      lecture_date,
      panopto_url,
      transcript,
    } = req.body;

    // Validation
    if (!title || !transcript) {
      return res
        .status(400)
        .json({ error: "Title and transcript are required" });
    }

    // 1. Create lecture record
    const { data: lecture, error: lectureError } = await supabase
      .from("lectures")
      .insert({
        user_id: user.id,
        user_module_id: user_module_id || null,
        title,
        module_code,
        module_name,
        lecturer_name,
        lecture_date,
        panopto_url,
        transcript_source: "panopto_paste",
        audio_path: "",
        status: "queued",
      })
      .select()
      .single();

    if (lectureError) throw lectureError;

    console.log("[panopto] called", {
      lecture_id: lecture.id,
      userId: user.id,
      title,
      transcriptLen: transcript.length,
    });

    // 2. Save transcript
    const { error: transcriptError } = await supabase
      .from("lecture_transcripts")
      .insert({
        lecture_id: lecture.id,
        transcript_text: transcript,
        word_count: transcript.split(/\s+/).length,
      });

    if (transcriptError) throw transcriptError;

    // 3. Trigger Background Analysis
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const origin = `${protocol}://${host}`;
    const backgroundUrl = `${origin}/.netlify/functions/lecture-process-background`;

    console.log(`[import-panopto] Enqueueing background job for ${lecture.id}`);

    try {
      const bRes = await fetch(backgroundUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lectureId: lecture.id,
          userId: user.id,
          transcript: transcript,
        }),
      });
      console.log(`[import-panopto] Background trigger status: ${bRes.status}`);
    } catch (err) {
      console.error("[import-panopto] Background trigger failed:", err);
    }

    return res.status(202).json({
      success: true,
      lecture_id: lecture.id,
      status: "summarizing",
    });
  } catch (error: any) {
    console.error("[lectures/import-panopto] Error:", error);
    return res
      .status(500)
      .json({ error: error.message || "Failed to import lecture" });
  }
}
