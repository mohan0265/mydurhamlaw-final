// POST /api/lectures/process
// Transcribes audio using Whisper and generates AI notes
import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const config = {
  api: {
    bodyParser: true,
    responseLimit: false,
  },
  maxDuration: 300, // 5 minutes for long audio
};

async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string,
): Promise<string> {
  const formData = new FormData();

  // Determine file extension from mime type
  const extMap: Record<string, string> = {
    "audio/mpeg": "mp3",
    "audio/mp4": "m4a",
    "audio/wav": "wav",
    "audio/webm": "webm",
    "audio/ogg": "ogg",
    "audio/x-m4a": "m4a",
  };
  const ext = extMap[mimeType] || "mp3";

  const blob = new Blob([audioBuffer], { type: mimeType });
  formData.append("file", blob, `audio.${ext}`);
  formData.append("model", "whisper-1");
  formData.append("language", "en");
  formData.append("response_format", "text");

  const response = await fetch(
    "https://api.openai.com/v1/audio/transcriptions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Whisper API error: ${response.status} ${error}`);
  }

  return response.text();
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

  // 90s Timeout Protection
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
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
${transcript.substring(0, 15000)} ${transcript.length > 15000 ? "... (truncated)" : ""}

**Task:** Generate a comprehensive analysis with the following sections:

1. **Summary** (2-3 paragraphs): Concise overview of the lecture's main content and learning objectives.

2. **Key Points** (5-7 bullet points): The most important concepts, cases, or principles covered.

3. **Discussion Topics** (3-5 items): Thought-provoking questions or themes suitable for essay practice or study group discussions.

4. **Exam Prompts** (3-5 items): Potential exam questions or practice prompts based on this lecture's content.

5. **Exam Signals**: Identify topic areas that are likely to be of high emphasis (Strength 1-5).

6. **Glossary**: Extract key definitions (term/definition pairs).

7. **Engagement Hooks**: Short phrases that make the content memorable or "sparkle".

Format your response as valid JSON:
{
  "summary": "...",
  "key_points": ["...", "..."],
  "discussion_topics": ["...", "..."],
  "exam_prompts": ["...", "..."],
  "exam_signals": [],
  "glossary": [{"term": "...", "definition": "..."}],
  "engagement_hooks": ["...", "..."]
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

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      throw new Error(`AI Analysis failed: ${response.status}`);
    }

    const data = await response.json();
    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textOutput) {
      throw new Error("No analysis received from AI");
    }

    const cleanJson = textOutput
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(cleanJson);
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error(
        "AI Processing timed out. Please try again or check transcript length.",
      );
    }
    throw error;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { lectureId, force } = req.body;
  if (!lectureId) {
    return res.status(400).json({ error: "lectureId is required" });
  }

  try {
    // Auth check
    const supabase = createPagesServerClient({ req, res });
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get lecture and verify ownership
    const { data: lecture, error: lectureError } = await supabase
      .from("lectures")
      .select("*")
      .eq("id", lectureId)
      .eq("user_id", user.id)
      .single();

    if (lectureError || !lecture) {
      return res.status(404).json({ error: "Lecture not found" });
    }

    // IDEMPOTENCY: Skip if already processed (unless force=true)
    if (lecture.status === "ready" && !force) {
      return res.status(200).json({ message: "Already processed", lecture });
    }

    // Clear any previous error and mark processing start
    await supabase
      .from("lectures")
      .update({
        error_message: null,
        last_processed_at: new Date().toISOString(),
      })
      .eq("id", lectureId);

    // Use service role for storage access
    const serviceSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY!);

    // Update status to transcribing
    await supabase
      .from("lectures")
      .update({ status: "transcribing" })
      .eq("id", lectureId);

    console.log(`[lectures/process] Starting transcription for ${lectureId}`);

    // Download audio from storage
    const { data: audioData, error: downloadError } =
      await serviceSupabase.storage
        .from("lecture_audio")
        .download(lecture.audio_path);

    if (downloadError || !audioData) {
      console.error("[lectures/process] Download error:", downloadError);
      await supabase
        .from("lectures")
        .update({ status: "error", error_message: "Failed to download audio" })
        .eq("id", lectureId);
      return res.status(500).json({ error: "Failed to download audio file" });
    }

    // Convert to buffer
    const audioBuffer = Buffer.from(await audioData.arrayBuffer());
    console.log(`[lectures/process] Downloaded ${audioBuffer.length} bytes`);

    // Transcribe using Whisper
    let transcript: string;
    try {
      transcript = await transcribeAudio(
        audioBuffer,
        lecture.audio_mime || "audio/mpeg",
      );
      console.log(
        `[lectures/process] Transcription complete: ${transcript.length} chars`,
      );
    } catch (error: any) {
      console.error("[lectures/process] Transcription error:", error);
      await supabase
        .from("lectures")
        .update({
          status: "error",
          error_message: `Transcription failed: ${error.message}`,
        })
        .eq("id", lectureId);
      return res.status(500).json({ error: "Transcription failed" });
    }

    // Save transcript
    const { error: transcriptError } = await supabase
      .from("lecture_transcripts")
      .upsert({
        lecture_id: lectureId,
        transcript_text: transcript,
        word_count: transcript.split(/\s+/).length,
      });

    if (transcriptError) {
      console.error(
        "[lectures/process] Transcript save error:",
        transcriptError,
      );
    }

    // Update status to summarizing
    await supabase
      .from("lectures")
      .update({ status: "summarizing" })
      .eq("id", lectureId);

    console.log(`[lectures/process] Starting summarization for ${lectureId}`);

    // Generate notes using Gemini (Standardized)
    let notes;
    try {
      notes = await generateLectureAnalysis({
        transcript,
        module_code: lecture.module_code,
        title: lecture.title,
        lecture_date: lecture.lecture_date,
      });
      console.log(
        `[lectures/process] Notes generated: ${notes.key_points?.length || 0} key points`,
      );
    } catch (error: any) {
      console.error("[lectures/process] Summarization error:", error);
      await supabase
        .from("lectures")
        .update({
          status: "error",
          error_message: `Summarization failed: ${error.message}`,
        })
        .eq("id", lectureId);
      return res.status(500).json({ error: "Summarization failed" });
    }

    // Save notes
    const { error: notesError } = await supabase.from("lecture_notes").upsert({
      lecture_id: lectureId,
      summary: notes.summary,
      key_points: notes.key_points,
      discussion_topics: notes.discussion_topics,
      exam_prompts: notes.exam_prompts,
      glossary: notes.glossary || [],
      engagement_hooks: notes.engagement_hooks || [],
      exam_signals: notes.exam_signals || [],
    });

    // --- LECTURER INSIGHTS PIPELINE ---
    const detectedName = (notes as any).lecturer_name_detected;
    if (
      detectedName &&
      typeof detectedName === "string" &&
      detectedName.length > 2
    ) {
      // 1. Upsert Lecturer
      const { data: lecturerData, error: lecturerError } = await supabase
        .from("lecturers")
        .upsert(
          {
            name_normalized: detectedName.trim().toLowerCase(),
            name: detectedName.trim(),
          },
          { onConflict: "name_normalized" },
        )
        .select()
        .single();

      if (lecturerData && !lecturerError) {
        // 2. Update Actions
        const style = (notes as any).teaching_style || {};

        const { error: insightError } = await supabase
          .from("lecturer_insights")
          .upsert(
            {
              lecturer_id: lecturerData.id,
              // We merge or overwrite the insights JSON.
              // Ideally we aggregate, but for now we take the latest lecture's style analysis as the "current" snapshot,
              // or mix it. For MVP, overwriting with latest specific style data is acceptable or we should merge.
              // Let's store the raw style object.
              insights_json: style,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "lecturer_id" },
          ); // Remove ignoreDuplicates to allow updating

        if (insightError) console.error("Insight update error", insightError);

        // Optional: Link lecture to lecturer (if column exists, or we use name matching)
        // For now, we update the lecture's lecturer_name text field if it was empty
        if (!lecture.lecturer_name) {
          await supabase
            .from("lectures")
            .update({ lecturer_name: detectedName })
            .eq("id", lectureId);
        }
      }
    }
    // ----------------------------------

    if (notesError) {
      console.error("[lectures/process] Notes save error:", notesError);
    }

    // Update status to ready
    await supabase
      .from("lectures")
      .update({ status: "ready" })
      .eq("id", lectureId);

    console.log(`[lectures/process] ✅ Complete for ${lectureId}`);

    return res.status(200).json({
      success: true,
      lectureId,
      transcript_length: transcript.length,
      notes_generated: true,
    });
  } catch (error: any) {
    console.error("[lectures/process] Error:", error);

    // Save error to database for visibility
    try {
      const supabase = createPagesServerClient({ req, res });
      await supabase
        .from("lectures")
        .update({
          status: "error",
          error_message: error.message || "Unknown processing error",
        })
        .eq("id", req.body.lectureId);
    } catch (dbError) {
      console.error("[lectures/process] Failed to save error to DB:", dbError);
    }

    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
}
