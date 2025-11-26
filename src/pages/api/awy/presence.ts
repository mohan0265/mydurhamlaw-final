// src/pages/api/awy/presence.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { requireUser } from "@/lib/server/auth";

/**
 * Lightweight presence endpoint for AWY & PresenceBadge.
 * Auth: Supabase cookie or Authorization: Bearer <JWT> (handled by getServerUser)
 *
 * If unauthenticated we intentionally return a harmless offline payload so the UI stays stable.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const got = await requireUser(req, res);
    if (!got) {
      console.debug('[AWY] presence unauthenticated request');
      return res.status(200).json({
        connected: false,
        me: null,
        lovedOnes: [],
      });
    }
    const { user, supabase } = got;

    if (!supabase) {
      console.debug('[AWY] presence supabase client missing for user:', user.id);
      return res.status(200).json({
        connected: true,
        me: { id: user.id, email: user.email ?? null },
        lovedOnes: [],
      });
    }

    // Future: hydrate loved ones once relationships are stored.
    return res.status(200).json({
      connected: true,
      me: { id: user.id, email: user.email ?? null },
      lovedOnes: [],
    });
  } catch (e: any) {
    console.error('AWY presence error:', e?.message || e);
    return res.status(200).json({
      connected: false,
      me: null,
      lovedOnes: [],
      error: 'presence_probe_failed',
    });
  }
}
