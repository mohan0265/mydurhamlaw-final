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
  console.log(
    `[background] Incoming transcript length: ${transcript?.length || 0}`,
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
      console.log(`[background] Status -> transcribing`);
      await Promise.all([
        supabaseAdmin
          .from("lectures")
          .update({ status: "transcribing", error_message: null })
          .eq("id", lectureId),
        lecture.academic_item_id
          ? supabaseAdmin
              .from("academic_items")
              .update({ state: { status: "transcribing", progress: 0.3 } })
              .eq("id", lecture.academic_item_id)
          : Promise.resolve(),
      ]);

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

    // 6. Update status to processing
    console.log("[background] Step 6: Updating status to processing");
    await Promise.all([
      supabaseAdmin
        .from("lectures")
        .update({ status: "processing" })
        .eq("id", lectureId),
      lecture.academic_item_id
        ? supabaseAdmin
            .from("academic_items")
            .update({ state: { status: "processing", progress: 0.6 } })
            .eq("id", lecture.academic_item_id)
        : Promise.resolve(),
    ]);

    // 7. Call OpenAI for Analysis
    console.log("[background] Calling OpenAI for analysis...");
    const analysis = await generateLectureAnalysis({
      transcript: transcriptText,
      title: lecture.title,
      moduleCode: lecture.module_code,
      moduleName: lecture.module_name,
      lecturerName: lecture.lecturer_name,
      lectureDate: lecture.lecture_date,
    });

    // 8. Save analysis results to lecture_notes
    console.log("[background] Step 8: Saving AI analysis to lecture_notes");
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

    await Promise.all([
      supabaseAdmin
        .from("lectures")
        .update({ status: "ready" })
        .eq("id", lectureId),
      lecture.academic_item_id
        ? supabaseAdmin
            .from("academic_items")
            .update({ state: { status: "ready", progress: 1.0 } })
            .eq("id", lecture.academic_item_id)
        : Promise.resolve(),
    ]);

    console.log(`[background] ✅ Successfully processed lecture ${lectureId}`);
  } catch (error) {
    console.error("[background] Critical Error:", error);

    // FETCH LECTURE AGAIN to get academic_item_id if needed (in case it wasn't fetched initially)
    // But we probably have it in `lecture` variable if step 1 succeeded.
    // Safety check:
    const aid = lecture?.academic_item_id;

    const errMsg = `AI Processing failed: ${error.message}`;

    await Promise.all([
      supabaseAdmin
        .from("lectures")
        .update({ status: "failed", error_message: errMsg })
        .eq("id", lectureId),
      aid
        ? supabaseAdmin
            .from("academic_items")
            .update({ state: { status: "failed", error: errMsg } })
            .eq("id", aid)
        : Promise.resolve(),
    ]);
  }
};

/**
 * Generates lecture analysis using OpenAI GPT-4o-mini
 */
async function generateLectureAnalysis(params) {
  const {
    transcript,
    title,
    moduleCode,
    moduleName,
    lecturerName,
    lectureDate,
  } = params;
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  const openai = new OpenAI({ apiKey });

  const systemPrompt =
    "You are a legal education AI agent that analyzes lectures and provides structured study materials in JSON format.";

  const userPrompt = `You are an expert law tutor analyzing a lecture transcript for a Durham University law student.

**Lecture Details:**
- Title: ${title}
- Module: ${moduleCode || "N/A"} ${moduleName ? `(${moduleName})` : ""}
- Lecturer: ${lecturerName || "N/A"}
- Date: ${lectureDate || "N/A"}

**Transcript:**
${transcript.substring(0, 40000)} ${transcript.length > 40000 ? "... (truncated)" : ""}

**Task:** Generate a comprehensive analysis of the provided lecture transcript.`;

  console.log(`[background] Sending analysis request to OpenAI (${model})...`);
  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "caseway_lecture_analysis_v1",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: [
            "summary",
            "key_points",
            "discussion_topics",
            "exam_prompts",
            "glossary",
            "engagement_hooks",
            "exam_signals",
          ],
          properties: {
            summary: {
              type: "string",
              minLength: 120,
              description:
                "A clear, student-friendly lecture summary in plain English.",
            },
            key_points: {
              type: "array",
              minItems: 6,
              maxItems: 18,
              items: { type: "string", minLength: 20 },
              description: "Bullet-style key takeaways.",
            },
            discussion_topics: {
              type: "array",
              minItems: 4,
              maxItems: 12,
              items: { type: "string", minLength: 15 },
              description: "Tutorial/seminar discussion questions or prompts.",
            },
            exam_prompts: {
              type: "array",
              minItems: 4,
              maxItems: 10,
              items: { type: "string", minLength: 20 },
              description: "Exam-style prompts (problem + essay mix).",
            },
            glossary: {
              type: "array",
              minItems: 6,
              maxItems: 30,
              items: {
                type: "object",
                additionalProperties: false,
                required: ["term", "definition"],
                properties: {
                  term: { type: "string", minLength: 2, maxLength: 80 },
                  definition: { type: "string", minLength: 20, maxLength: 320 },
                },
              },
              description: "Key terms and definitions.",
            },
            engagement_hooks: {
              type: "array",
              minItems: 3,
              maxItems: 10,
              items: { type: "string", minLength: 15, maxLength: 140 },
              description:
                "Short memorable hooks, mnemonics, contrasts, or analogies to aid recall.",
            },
            exam_signals: {
              type: "object",
              additionalProperties: false,
              required: ["signal_strength", "signals"],
              properties: {
                signal_strength: {
                  type: "integer",
                  minimum: 0,
                  maximum: 100,
                  description:
                    "How exam-relevant the lecture is overall (0-100).",
                },
                signals: {
                  type: "array",
                  minItems: 4,
                  maxItems: 16,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["topic", "why_it_matters", "likely_exam_angles"],
                    properties: {
                      topic: { type: "string", minLength: 8, maxLength: 120 },
                      why_it_matters: {
                        type: "string",
                        minLength: 30,
                        maxLength: 280,
                      },
                      likely_exam_angles: {
                        type: "array",
                        minItems: 2,
                        maxItems: 6,
                        items: {
                          type: "string",
                          minLength: 15,
                          maxLength: 160,
                        },
                      },
                    },
                  },
                  description: "Structured exam signals per topic.",
                },
              },
            },
          },
        },
      },
    },
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No analysis received from OpenAI");
  }

  try {
    return JSON.parse(content);
  } catch (e) {
    console.error("[background] Failed to parse AI JSON:", content);
    throw new Error("Failed to parse AI response as JSON");
  }
}
