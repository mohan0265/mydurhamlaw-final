// src/pages/api/awy/notifications.ts
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
    console.debug('[AWY] requireUser: unauthenticated (notifications)');
    return;
  }

  const { user, supabase } = got;

  switch (req.method) {
    case "GET": {
      const raw = Array.isArray(req.query.unread_only)
        ? req.query.unread_only[0]
        : (req.query.unread_only as string | undefined);
      const unreadOnly = (raw ?? "false").toLowerCase() === "true";

      try {
        let query = supabase!
          .from("awy_notifications")
          .select("*")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false });

        const { data, error } = await query;
        if (error) throw error;
        let notifications = (data ?? []) as any[];

        if (unreadOnly) {
          notifications = notifications.filter((n) =>
            n?.is_read === false || n?.read_at == null
          );
        }

        return ok(res, { notifications });
      } catch (fetchError: any) {
        return failSoft(res, { notifications: [] }, fetchError);
      }
    }

    case "PUT": {
      const { notificationId, markAllAsRead } =
        (req.body as { notificationId?: string; markAllAsRead?: boolean }) || {};

      if (!notificationId && !markAllAsRead) {
        return res.status(400).json({ ok: false, error: "No notification target provided" });
      }

      const timestamp = new Date().toISOString();

      if (markAllAsRead) {
        try {
          const { error } = await supabase!
            .from("awy_notifications")
            .update({ is_read: true, read_at: timestamp })
            .eq("user_id", user!.id);

          if (error) throw error;
          return ok(res, {
            success: true,
            message: "All notifications marked as read",
          });
        } catch (updateAllError: any) {
          return failSoft(res, {
            success: false,
            message: "Could not mark all notifications right now",
          }, updateAllError);
        }
      }

      if (notificationId) {
        try {
          const { error } = await supabase!
            .from("awy_notifications")
            .update({ is_read: true, read_at: timestamp })
            .eq("id", notificationId)
            .eq("user_id", user!.id);

          if (error) throw error;
          return ok(res, {
            success: true,
            message: "Notification marked as read",
          });
        } catch (updateError: any) {
          return failSoft(res, {
            success: false,
            message: "Could not mark notification as read",
          }, updateError);
        }
      }

      return ok(res, {
        success: true,
        message: "Nothing to update",
      });
    }

    default: {
      res.setHeader("Allow", ["GET", "PUT"]);
      return res.status(405).json({ ok: false, error: "method_not_allowed" });
    }
  }
}
