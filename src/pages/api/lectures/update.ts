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
    let reprocess = false;
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
            updated_at: new Date().toISOString(),
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

    return res.status(200).json({ lecture: updated, reprocessed: reprocess });
  } catch (error: any) {
    console.error("Error updating lecture:", error);
    return res.status(500).json({ error: error.message });
  }
}
