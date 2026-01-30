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

    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 1. Get structured lecturers
    const { data: structuredLecturers, error: structuredError } = await supabase
      .from("lecturers")
      .select("id, name")
      .order("name");

    if (structuredError && structuredError.code !== "PGRST116") {
      console.warn("Error fetching lecturers table:", structuredError);
    }

    // 2. Get ad-hoc lecturers from lectures table (fallback/supplement)
    const { data: adhocLecturers, error: adhocError } = await supabase
      .from("lectures")
      .select("lecturer_name")
      .not("lecturer_name", "is", null);

    // Merge and Deduplicate
    const names = new Set<string>();
    const result = [];

    // Add structured first (they have IDs)
    if (structuredLecturers) {
      for (const l of structuredLecturers) {
        if (l.name) {
          names.add(l.name.trim());
          result.push({ id: l.id, name: l.name.trim(), lectureCount: 0 }); // Count valid but expensive to fetch consistently if mixed
        }
      }
    }

    // Add adhoc if new
    if (adhocLecturers) {
      for (const l of adhocLecturers) {
        const name = l.lecturer_name?.trim();
        if (name && !names.has(name)) {
          names.add(name);
          // Generate a pseudo-ID or leave null? Frontend expects ID maybe?
          // LecturerSelect uses `l.id` for key. We can use name as ID for adhoc.
          result.push({ id: `adhoc-${name}`, name: name, lectureCount: 0 });
        }
      }
    }

    // Sort
    result.sort((a, b) => a.name.localeCompare(b.name));

    return res.status(200).json({ lecturers: result });
  } catch (err: any) {
    console.error("Error listing lecturers:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
