// GET /api/lectures/list
// Returns all lectures for the authenticated user
import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
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

    const { module_code, status, limit } = req.query;

    let query = supabase
      .from("lectures")
      .select(
        "id, title, module_code, module_name, lecturer_name, lecture_date, status, created_at, updated_at, last_processed_at",
      )
      .eq("user_id", user.id)
      .order("lecture_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    // Optional filters
    if (module_code && typeof module_code === "string") {
      query = query.eq("module_code", module_code);
    }
    if (status && typeof status === "string") {
      query = query.eq("status", status);
    }
    if (limit && typeof limit === "string") {
      query = query.limit(parseInt(limit));
    }

    const { data: lectures, error } = await query;

    if (error) {
      console.error("[lectures/list] Query error:", error);
      return res.status(500).json({ error: "Failed to fetch lectures" });
    }

    return res.status(200).json({ lectures: lectures || [] });
  } catch (error: any) {
    console.error("[lectures/list] Error:", error);
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
}
