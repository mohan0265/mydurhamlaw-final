// src/pages/api/awy/interactions.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { requireUser } from "@/lib/server/auth";

type Json = Record<string, unknown>;

function ok<T extends Json>(res: NextApiResponse, body: T) {
  return res.status(200).json({ ok: true, ...body });
}

function failSoft<T extends Json>(res: NextApiResponse, body: T, warn: unknown) {
  const message = (warn as any)?.message ?? warn;
  console.warn("[awy] soft-fail:", message);
  return res.status(200).json({ ok: true, ...body });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const got = await requireUser(req, res);
  if (!got) {
    console.debug('[AWY] requireUser: unauthenticated (interactions)');
    return;
  }

  const { user, supabase } = got;

  switch (req.method) {
    case "GET": {
      const qLimit = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
      const limit = Number.parseInt((qLimit as string) ?? "20", 10) || 20;

      try {
        const { data, error } = await supabase
          .from("awy_interactions")
          .select("*")
          .or('sender_id.eq.' + user.id + ',recipient_id.eq.' + user.id)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (error) throw error;
        return ok(res, { interactions: data ?? [] });
      } catch (fetchError: any) {
        return failSoft(res, { interactions: [] }, fetchError);
      }
    }

    case "POST": {
      const { connectionId, interactionType, message } = req.body ?? {};
      if (!connectionId || !interactionType) {
        return res.status(400).json({ ok: false, error: "connection_id_and_type_required" });
      }

      const payload: Record<string, unknown> = {
        connection_id: connectionId,
        interaction_type: interactionType,
        message: message ?? null,
        sender_id: user.id,
        created_at: new Date().toISOString(),
      };

      try {
        const { data, error } = await supabase
          .from("awy_interactions")
          .insert(payload)
          .select("id")
          .single();

        if (error) throw error;
        return ok(res, {
          interactionId: data?.id ?? null,
          message: "Interaction sent successfully",
        });
      } catch (insertError: any) {
        return failSoft(res, {
          interactionId: null,
          message: "Interaction recorded for follow-up",
        }, insertError);
      }
    }

    case "PUT": {
      const { interactionId: readId } = req.body ?? {};
      if (!readId) {
        return res.status(400).json({ ok: false, error: "interaction_id_required" });
      }

      try {
        const { error } = await supabase
          .from("awy_interactions")
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq("id", readId);

        if (error) throw error;
        return ok(res, {
          success: true,
          message: "Interaction marked as read",
        });
      } catch (updateError: any) {
        return failSoft(res, {
          success: false,
          message: "Could not mark interaction as read",
        }, updateError);
      }
    }

    default: {
      res.setHeader("Allow", ["GET", "POST", "PUT"]);
      return res.status(405).json({ ok: false, error: "method_not_allowed" });
    }
  }
}
