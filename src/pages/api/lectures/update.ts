import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";

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
    } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Lecture ID is required" });
    }

    // 1. Fetch existing lecture to compare
    const { data: existing, error: fetchError } = await supabase
      .from("lectures")
      .select("transcript, user_id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      console.error("Lecture lookup failed:", fetchError, "ID:", id);
      return res
        .status(404)
        .json({ error: `Lecture record not found for ID: ${id}` });
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

    // 3. Handle Transcript Change
    let reprocess = false;
    if (typeof transcript === "string") {
      const oldT = (existing.transcript || "").trim();
      const newT = transcript.trim();

      if (oldT !== newT) {
        updates.transcript = transcript;
        updates.status = "uploaded"; // Trigger reprocessing
        updates.notes = null; // Clear old AI notes
        reprocess = true;
      }
    }

    // 4. Perform Update
    const { data: updated, error: updateError } = await supabase
      .from("lectures")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Trigger explicit process if needed
    if (reprocess) {
      // Optional: fire & forget process call
      // fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/lectures/process`, ...).catch(...)
    }

    return res.status(200).json({ lecture: updated, reprocessed: reprocess });
  } catch (error: any) {
    console.error("Error updating lecture:", error);
    return res.status(500).json({ error: error.message });
  }
}
