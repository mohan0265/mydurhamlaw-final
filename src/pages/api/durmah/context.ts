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
    let { module_id, focusDate, rangeDays, pageHint } = req.query;

    // EMERGENCY DEFAULTS: NEVER 400 ON MISSING PARAMS
    if (!focusDate || typeof focusDate !== "string") {
      focusDate = new Date().toISOString().substring(0, 10);
    }
    if (!rangeDays || typeof rangeDays !== "string") {
      rangeDays = "14";
    }

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
      // Use the enhanced context builder (Single Source of Truth)
      // This fetches Profile, YAAG, Assignments, etc.
      const { enhanceDurmahContext } = await import(
        "@/lib/durmah/contextBuilderEnhanced"
      );

      const baseCtx = {
        student: {
          displayName: session.user.user_metadata?.full_name || "",
          yearGroup: "",
          term: "",
          weekOfTerm: 0,
          localTimeISO: new Date().toISOString(),
        },
        assignments: {
          upcoming: [],
          overdue: [],
          recentlyCreated: [],
          total: 0,
        },
        schedule: { todaysClasses: [] },
      };

      // Extract lectureId/assignmentId from query for specific context enhancement if needed
      const lectureId =
        typeof req.query.lectureId === "string"
          ? req.query.lectureId
          : undefined;

      const fullContext = await enhanceDurmahContext(
        supabase,
        session.user.id,
        baseCtx as any,
        undefined, // conversationId not needed for pure context fetch
        lectureId,
      );

      return res.status(200).json(fullContext);

      return res.status(200).json({ ok: true, ...mockContext });
    } catch (err: any) {
      console.error(err);
      // Return 200 with error field to prevent client retry loops on 500
      return res
        .status(200)
        .json({ ok: false, error: err.message, fallback: true });
    }
  }

  res.setHeader("Allow", ["GET"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
