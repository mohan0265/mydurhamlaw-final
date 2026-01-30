// POST /api/lectures/process
// Triggers heavy AI processing via Netlify Background Function to avoid timeouts
import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { LECTURE_STATUSES } from "@/lib/lectures/status";

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
    const supabase = createPagesServerClient({ req, res });
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 1. Verify ownership and lecture existence
    const { data: lecture, error: lectureError } = await supabase
      .from("lectures")
      .select("*")
      .eq("id", lectureId)
      .eq("user_id", user.id)
      .single();

    if (lectureError || !lecture) {
      return res.status(404).json({ error: "Lecture not found" });
    }

    // 2. Idempotency: skip if already ready unless forced
    if (lecture.status === "ready" && !force) {
      return res
        .status(200)
        .json({ success: true, message: "Already processed", status: "ready" });
    }

    // 3. Mark as processing
    console.log("[process] triggering processing", {
      lectureId,
      userId: user.id,
    });
    await supabase
      .from("lectures")
      .update({
        status: LECTURE_STATUSES.PROCESSING,
        error_message: null,
        last_processed_at: new Date().toISOString(),
      })
      .eq("id", lectureId);

    // 4. Trigger Netlify Background Function
    // We derive the origin from headers to call the co-located function
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const origin = `${protocol}://${host}`;

    // Background functions are triggered by sending a POST to the endpoint
    // We don't wait for the result since it returns 202 immediately.
    const backgroundUrl = `${origin}/.netlify/functions/lecture-process-background`;

    console.log(
      `[lectures/process] Enqueueing background job: ${backgroundUrl}`,
    );

    try {
      const bRes = await fetch(backgroundUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lectureId, userId: user.id }),
      });
      console.log(
        `[lectures/process] Background trigger status: ${bRes.status}`,
      );
    } catch (err) {
      console.error(
        "[lectures/process] Failed to trigger background task:",
        err,
      );
    }

    return res.status(202).json({
      success: true,
      queued: true,
      lectureId,
      status: "uploaded",
    });
  } catch (error: any) {
    console.error("[lectures/process] Error:", error);
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
}
