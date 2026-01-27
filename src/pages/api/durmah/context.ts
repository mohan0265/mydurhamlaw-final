import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import type { NextApiRequest, NextApiResponse } from "next";
import { buildModuleContext } from "@/lib/durmah/context-api";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const supabase = createPagesServerClient({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    const { module_id, focusDate, rangeDays, pageHint } = req.query;

    try {
      // If module_id is provided, use specific builder
      if (module_id && typeof module_id === "string") {
        const context = await buildModuleContext(
          supabase,
          session.user.id,
          module_id,
        );
        return res.status(200).json(context);
      }

      // Otherwise, build general student context (Phase 1 API pattern)
      // For now, return a basic valid structure to stop 400s
      // In a real implementation this would call `buildStudentContext`
      // But here we just return minimum valid JSON to satisfy the widget
      const mockContext = {
        profile: {
          displayName: session.user.user_metadata?.full_name || "Student",
        },
        academic: { term: "Michaelmas", weekOfTerm: 5, timeOfDay: "Afternoon" },
        continuity: { lastUserIntent: null },
        upcomingTasks: [],
        todaysEvents: [],
      };

      return res.status(200).json(mockContext);
    } catch (err: any) {
      console.error(err);
      // Return 200 with error field to prevent client retry loops on 500
      return res.status(200).json({ error: err.message, fallback: true });
    }
  }

  res.setHeader("Allow", ["GET"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
