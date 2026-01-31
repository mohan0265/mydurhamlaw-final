// POST /api/lectures/create
// Creates a lecture record and returns a signed upload URL for direct client upload
import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";

const ALLOWED_EXTENSIONS = ["mp3", "m4a", "wav", "webm", "ogg"];
const ALLOWED_MIMES = [
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/webm",
  "audio/ogg",
  "audio/x-m4a",
];
const MAX_FILE_SIZE_MB = 50;

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
      user_module_id,
      module_code,
      module_name,
      lecturer_name,
      title,
      lecture_date,
      audio_ext,
      audio_mime,
    } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }
    if (!audio_ext || !audio_mime) {
      return res.status(400).json({ error: "Audio file info required" });
    }

    // Validate file type
    const ext = audio_ext.toLowerCase().replace(".", "");
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return res.status(400).json({
        error: `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`,
      });
    }

    // Generate lecture ID and audio path
    const lectureId = crypto.randomUUID();
    const audioPath = `lectures/${user.id}/${lectureId}.${ext}`;

    // Create lecture record with status='uploaded'
    const { data: lecture, error: insertError } = await supabase
      .from("lectures")
      .insert({
        id: lectureId,
        user_id: user.id,
        user_module_id: user_module_id || null, // Link to central module
        module_code: module_code || null,
        module_name: module_name || null,
        lecturer_name: lecturer_name || null,
        title,
        lecture_date: lecture_date || null,
        audio_path: audioPath,
        audio_mime: audio_mime,
        status: "uploaded",
        processing_state: "uploaded",
      })
      .select()
      .single();

    if (insertError) {
      console.error("[lectures/create] Insert error:", insertError);
      return res.status(500).json({ error: "Failed to create lecture record" });
    }

    // Create signed upload URL for direct client upload
    const { data: signedUrl, error: signedUrlError } = await supabase.storage
      .from("lecture_audio")
      .createSignedUploadUrl(audioPath);

    if (signedUrlError) {
      console.error("[lectures/create] Signed URL error:", signedUrlError);
      // Rollback the lecture record
      await supabase.from("lectures").delete().eq("id", lectureId);
      return res.status(500).json({ error: "Failed to create upload URL" });
    }

    console.log(
      `[lectures/create] Created lecture ${lectureId} for user ${user.id}`,
    );

    return res.status(200).json({
      lectureId,
      uploadPath: audioPath,
      signedUploadUrl: signedUrl.signedUrl,
      token: signedUrl.token,
      lecture,
    });
  } catch (error: any) {
    console.error("[lectures/create] Error:", error);
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
}
