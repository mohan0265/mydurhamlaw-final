const { OpenAI } = require("openai");
const { supabaseAdmin } = require("./_lib/supabase");

/**
 * Netlify Background Function for processing lectures.
 * Filename: lecture-process-background.js
 * Triggered by: /.netlify/functions/lecture-process-background
 */
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let lectureId, userId, transcript;
  try {
    const body = JSON.parse(event.body);
    lectureId = body.lectureId;
    userId = body.userId;
    transcript = body.transcript;
  } catch (e) {
    console.error("[background] Failed to parse body:", e);
    return;
  }

  if (!lectureId || !userId) {
    console.error("[background] Missing lectureId or userId");
    return;
  }

  console.log(
    `[background] Starting process for lecture ${lectureId} (User: ${userId})`,
  );

  try {
    // 1. Fetch lecture details
    const { data: lecture, error: fetchError } = await supabaseAdmin
      .from("lectures")
      .select("*")
      .eq("id", lectureId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !lecture) {
      console.error("[background] Lecture not found:", fetchError);
      return;
    }

    let transcriptText = transcript;

    // Only transcribe if transcript wasn't provided in the request
    if (!transcriptText) {
      // 2. Update status to transcribing
      await supabaseAdmin
        .from("lectures")
        .update({ status: "transcribing", error_message: null })
        .eq("id", lectureId);

      // 3. Download audio from Storage
      console.log(`[background] Downloading audio: ${lecture.audio_path}`);
      const { data: audioData, error: downloadError } =
        await supabaseAdmin.storage
          .from("lecture_audio")
          .download(lecture.audio_path);

      if (downloadError || !audioData) {
        throw new Error(`Failed to download audio: ${downloadError?.message}`);
      }

      // 4. Transcribe with OpenAI Whisper
      console.log("[background] Sending to Whisper...");
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const arrayBuffer = await audioData.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const ext = lecture.audio_path.split(".").pop() || "mp3";

      const transcription = await openai.audio.transcriptions.create({
        file: await OpenAI.toFile(buffer, `audio.${ext}`),
        model: "whisper-1",
        response_format: "text",
      });

      transcriptText =
        typeof transcription === "string"
          ? transcription
          : transcription.text || "";
      if (!transcriptText) {
        throw new Error("Whisper returned empty transcript");
      }

      // 5. Save transcript
      console.log("[background] Saving transcript...");
      const { error: tError } = await supabaseAdmin
        .from("lecture_transcripts")
        .upsert({
          lecture_id: lectureId,
          transcript_text: transcriptText,
          word_count: transcriptText.split(/\s+/).length,
        });

      if (tError) {
        throw new Error(`Failed to save transcript: ${tError.message}`);
      }
    }

    // 6. Update status to summarizing
    console.log("[background] Step 6: Updating status to summarizing");
    await supabaseAdmin
      .from("lectures")
      .update({ status: "summarizing" })
      .eq("id", lectureId);

    // 7. Call Gemini for Analysis
    console.log("[background] Calling Gemini for analysis...");
    const analysis = await generateLectureAnalysis({
      transcript: transcriptText,
      title: lecture.title,
      module_code: lecture.module_code,
      lecture_date: lecture.lecture_date,
    });

    // 8. Save analysis results to lecture_notes
    console.log("[background] Step 8: Saving AI analysis to lecture_notes");
    console.log("[background] Saving AI notes...");
    const { error: notesError } = await supabaseAdmin
      .from("lecture_notes")
      .upsert({
        lecture_id: lectureId,
        summary: analysis.summary,
        key_points: analysis.key_points || [],
        discussion_topics: analysis.discussion_topics || [],
        exam_prompts: analysis.exam_prompts || [],
        exam_signals: analysis.exam_signals || [],
        glossary: analysis.glossary || [],
        engagement_hooks: analysis.engagement_hooks || [],
        created_at: new Date().toISOString(),
      });

    if (notesError) {
      throw new Error(`Failed to save lecture notes: ${notesError.message}`);
    }

    // 9. Update status to ready
    console.log(
      `[background] Processing complete for ${lectureId}. Final status: ready`,
    );
    await supabaseAdmin
      .from("lectures")
      .update({ status: "ready" })
      .eq("id", lectureId);

    console.log(`[background] ✅ Successfully processed lecture ${lectureId}`);
  } catch (error) {
    console.error("[background] Critical Error:", error);
    await supabaseAdmin
      .from("lectures")
      .update({
        status: "error",
        error_message: `AI Processing failed: ${error.message}`,
      })
      .eq("id", lectureId);
  }
};

async function generateLectureAnalysis(params) {
  const { transcript, title, module_code, lecture_date } = params;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

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
${transcript.substring(0, 20000)} ${transcript.length > 20000 ? "... (truncated)" : ""}

**Task:** Generate a comprehensive analysis with the following sections:
1. Summary, 2. Key Points, 3. Discussion Topics, 4. Exam Prompts, 5. Exam Signals, 6. Glossary, 7. Engagement Hooks.

Format your response as valid JSON:
{
  "summary": "...",
  "key_points": ["..."],
  "discussion_topics": ["..."],
  "exam_prompts": ["..."],
  "exam_signals": [{"topic_title": "...", "signal_strength": 5, "why_it_matters": "...", "what_to_master": ["..."], "common_traps": ["..."]}],
  "glossary": [{"term": "...", "definition": "..."}],
  "engagement_hooks": ["..."]
}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2500,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textOutput) {
    throw new Error("No analysis received from Gemini");
  }

  const cleanJson = textOutput
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleanJson);
  } catch (e) {
    throw new Error("Failed to parse AI response as JSON");
  }
}
