import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";

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

    // Use Service Role Client for robustness
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const dbClient =
      serviceRoleKey && supabaseUrl
        ? createClient(supabaseUrl, serviceRoleKey)
        : supabase;

    // 1. Verify ownership
    const { data: existing, error: fetchError } = await dbClient
      .from("lectures")
      .select("user_id, status")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ error: "Lecture not found" });
    }

    if (existing.user_id !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // 2. Prepare updates
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

    let needsReprocess = !!forceReprocess;

    // 3. Handle Transcript
    if (typeof transcript === "string" && transcript.trim().length > 0) {
      // Check if it's different
      const { data: tData } = await dbClient
        .from("lecture_transcripts")
        .select("transcript_text")
        .eq("lecture_id", id)
        .single();

      if (!tData || tData.transcript_text.trim() !== transcript.trim()) {
        await dbClient.from("lecture_transcripts").upsert({
          lecture_id: id,
          transcript_text: transcript,
          word_count: transcript.split(/\s+/).length,
        });
        needsReprocess = true;
      }
    }

    // 4. If reprocessing, clear old notes and set status
    if (needsReprocess) {
      await dbClient.from("lecture_notes").delete().eq("lecture_id", id);
      updates.status = "processing";
    }

    // 5. Save updates
    const { data: updated, error: updateError } = await dbClient
      .from("lectures")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    // 6. Trigger Background Process if needed
    if (needsReprocess) {
      const protocol = req.headers["x-forwarded-proto"] || "https";
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      const origin = `${protocol}://${host}`;
      const backgroundUrl = `${origin}/.netlify/functions/lecture-process-background`;

      console.log("[update] triggering reprocess", {
        lectureId: id,
        userId: user.id,
      });

      try {
        const bRes = await fetch(backgroundUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lectureId: id,
            userId: user.id,
            transcript: needsReprocess ? transcript : undefined, // Pass edited transcript if changed
          }),
        });
        console.log(`[update] Background trigger status: ${bRes.status}`);
      } catch (err) {
        console.error("[update] Background trigger failed:", err);
      }
    }

    return res.status(200).json({
      success: true,
      lecture: updated,
      reprocessed: needsReprocess,
    });
  } catch (error: any) {
    console.error("[lectures/update] Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
