import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabase = createServerSupabaseClient({ req, res });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
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
    return res.status(400).json({
      error: "Title and transcript are required",
    });
  }

  if (transcript.length < 100) {
    return res.status(400).json({
      error: "Transcript is too short. Please paste at least 100 characters.",
    });
  }

  try {
    // 1. Create lecture record
    const { data: lecture, error: lectureError } = await supabase
      .from("lectures")
      .insert({
        user_id: user.id,
        user_module_id: user_module_id || null, // Link to central module
        title,
        module_code,
        module_name,
        lecturer_name,
        lecture_date,
        panopto_url,
        transcript_source: "panopto_paste",
        audio_path: "", // Not applicable for Panopto imports
        status: "uploaded", // Set to uploaded so background processing picks it up if needed, or we process below
      })
      .select()
      .single();

    if (lectureError) throw lectureError;

    // 2. Save transcript
    const { error: transcriptError } = await supabase
      .from("lecture_transcripts")
      .insert({
        lecture_id: lecture.id,
        transcript_text: transcript,
        word_count: transcript.split(/\s+/).length,
      });

    if (transcriptError) throw transcriptError;

    // 3. Trigger AI analysis (with timeout protection)
    let analysis;
    try {
      analysis = await Promise.race([
        generateLectureAnalysis({
          transcript,
          module_code,
          title,
          lecture_date,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Analysis timeout")), 15000),
        ),
      ]);
    } catch (analysisError) {
      console.error("AI analysis failed:", analysisError);
      // Continue without analysis - lecture is still imported
      await supabase
        .from("lectures")
        .update({
          status: "ready",
          error_message: "Analysis failed, but transcript saved successfully",
        })
        .eq("id", lecture.id);

      return res.status(200).json({
        success: true,
        lecture_id: lecture.id,
        warning:
          "Lecture imported but AI analysis failed. You can retry later.",
      });
    }

    // 4. Save analysis results
    const { error: notesError } = await supabase.from("lecture_notes").insert({
      lecture_id: lecture.id,
      summary: analysis.summary,
      key_points: analysis.key_points,
      discussion_topics: analysis.discussion_topics,
      exam_prompts: analysis.exam_prompts || [],
    });

    if (notesError) {
      console.error("Failed to save notes:", notesError);
      // Still mark as ready even if notes fail
    }

    // 5. Update lecture status
    await supabase
      .from("lectures")
      .update({ status: "ready" })
      .eq("id", lecture.id);

    return res.status(200).json({
      success: true,
      lecture_id: lecture.id,
      analysis,
    });
  } catch (error: any) {
    console.error("Panopto import error:", error);
    return res.status(500).json({
      error: "Failed to import lecture",
      details: error.message,
    });
  }
}

async function generateLectureAnalysis(params: {
  transcript: string;
  module_code?: string;
  title: string;
  lecture_date?: string;
}) {
  const { transcript, module_code, title, lecture_date } = params;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  // Call Gemini API for analysis
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are an expert law tutor analyzing a lecture transcript for a Durham University law student.

**Lecture Details:**
- Title: ${title}
- Module: ${module_code || "N/A"}
- Date: ${lecture_date || "N/A"}

**Transcript:**
${transcript.substring(0, 10000)} ${transcript.length > 10000 ? "... (truncated)" : ""}

**Task:** Generate a comprehensive analysis with the following sections:

1. **Summary** (2-3 paragraphs): Concise overview of the lecture's main content and learning objectives.

2. **Key Points** (5-7 bullet points): The most important concepts, cases, or principles covered.

3. **Discussion Topics** (3-5 items): Thought-provoking questions or themes suitable for essay practice or study group discussions.

4. **Exam Prompts** (3-5 items): Potential exam questions or practice prompts based on this lecture's content.

Format your response as valid JSON:
{
  "summary": "...",
  "key_points": ["...", "..."],
  "discussion_topics": ["...", "..."],
  "exam_prompts": ["...", "..."]
}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        },
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("No response from Gemini API");
  }

  // Parse JSON response (handle markdown code blocks)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse AI response as JSON");
  }

  return JSON.parse(jsonMatch[0]);
}
