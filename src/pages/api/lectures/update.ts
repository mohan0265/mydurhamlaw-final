import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Debug log to confirm endpoint is hit
  console.log(`[API] ${req.method} /api/lectures/update`);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 1. Authenticate User (Standard)
    const supabase = createPagesServerClient({ req, res });
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn("Update failed: Unauthorized", authError);
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
      id,
      title,
      user_module_id,
      module_code,
      module_name,
      lecturer_name,
      lecture_date,
      panopto_url,
      transcript,
      reprocess: forceReprocess,
    } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Lecture ID is required" });
    }

    // 2. Use Admin Client to Bypass RLS (for reliability)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    let dbClient = supabase;

    if (serviceRoleKey && supabaseUrl) {
      dbClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }) as any;
    }

    // 3. Fetch existing lecture + transcript correctly
    // FIX: transcript_text is in lecture_transcripts table, NOT lectures table.
    const { data: existing, error: fetchError } = await dbClient
      .from("lectures")
      .select(
        `
        user_id,
        lecture_transcripts (transcript_text)
      `,
      )
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      console.error("Lecture lookup failed on Server:", {
        error: fetchError,
        id,
        userId: user.id,
      });
      return res.status(404).json({
        error: `Lecture record not found for ID: ${id}`,
        debug: {
          fetchError: fetchError?.message || "No specific error",
          id,
        },
      });
    }

    // 4. Manually Enforce Ownership
    if (existing.user_id !== user.id) {
      console.warn("Ownership mismatch", {
        existing_owner: existing.user_id,
        request_user: user.id,
      });
      return res.status(403).json({
        error: "Forbidden: You do not own this lecture",
      });
    }

    // 5. Prepare updates for Lectures table
    const updates: any = {
      title,
      user_module_id: user_module_id || null,
      module_code: module_code || null,
      module_name: module_name || null,
      lecturer_name: lecturer_name || null,
      lecture_date: lecture_date || null,
      panopto_url: panopto_url || null,
      updated_at: new Date().toISOString(),
    };

    // 6. Handle Transcript Change
    let reprocess = !!forceReprocess;
    if (typeof transcript === "string") {
      // transcript_text might be buried in the join array/object
      const existingTranscript = Array.isArray(existing.lecture_transcripts)
        ? existing.lecture_transcripts[0]?.transcript_text
        : (existing.lecture_transcripts as any)?.transcript_text;

      const oldT = (existingTranscript || "").trim();
      const newT = transcript.trim();

      if (oldT !== newT) {
        // Update transcript in dedicated table
        const { error: tError } = await dbClient
          .from("lecture_transcripts")
          .upsert({
            lecture_id: id,
            transcript_text: transcript,
          });

        if (tError) {
          console.error("Transcript update error:", tError);
          throw new Error("Failed to update transcript content");
        }

        updates.status = "uploaded"; // Trigger reprocessing
        updates.notes = null; // Clear old AI notes
        reprocess = true;
      }
    }

    // 7. Perform Update on main record
    const { data: updated, error: updateError } = await dbClient
      .from("lectures")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    // 8. If reprocess is true, Run AI analysis now (inline)
    if (reprocess && transcript) {
      try {
        const analysis = await generateLectureAnalysis({
          transcript,
          module_code: module_code || updated.module_code,
          title: title || updated.title,
          lecture_date: lecture_date || updated.lecture_date,
        });

        // Save analysis results
        const { error: notesError } = await dbClient
          .from("lecture_notes")
          .upsert({
            lecture_id: id,
            summary: analysis.summary,
            key_points: analysis.key_points,
            discussion_topics: analysis.discussion_topics,
            exam_prompts: analysis.exam_prompts || [],
            exam_signals: analysis.exam_signals || [],
          });

        if (notesError)
          console.error("Failed to save reprocessed notes:", notesError);

        // Update status to ready
        await dbClient
          .from("lectures")
          .update({ status: "ready" })
          .eq("id", id);

        return res.status(200).json({
          lecture: { ...updated, status: "ready" },
          reprocessed: true,
          analysis,
        });
      } catch (analysisError) {
        console.error("Reprocess analysis failed:", analysisError);
        // Still return success for the update, but maybe a warning
        return res.status(200).json({
          lecture: updated,
          reprocessed: true,
          warning: "Update saved, but AI analysis failed to run.",
        });
      }
    }

    return res.status(200).json({ lecture: updated, reprocessed: reprocess });
  } catch (error: any) {
    console.error("Error updating lecture:", error);
    return res.status(500).json({ error: error.message });
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

5. **Exam Signals**: Identify if there are specific concepts highly relevant for exams.

Format your response as valid JSON:
{
  "summary": "...",
  "key_points": ["...", "..."],
  "discussion_topics": ["...", "..."],
  "exam_prompts": ["...", "..."],
  "exam_signals": []
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
