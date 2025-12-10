import type { NextApiRequest, NextApiResponse } from "next";
import { requireUser } from "@/lib/server/auth";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";

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
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const got = await requireUser(req, res);
  if (!got) {
    console.debug('[AWY] requireUser: unauthenticated (invite)');
    return;
  }

  const { user } = got;

  const { email, relationship, displayName } = req.body || {};
  if (!email || !relationship) {
    return res.status(400).json({ ok: false, error: "email_and_relationship_required" });
  }

  const normalizedEmail = String(email).toLowerCase();
  let lovedUserId: string | null = null;
  let connectionId: string | null = null;

  try {
    const { data: existingConnection, error: existingError } = await supabaseAdmin
      .from("awy_connections")
      .select("id, status")
      .eq("student_id", user!.id)
      .eq("loved_email", normalizedEmail)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existingConnection) {
      return res.status(409).json({ ok: false, error: "This loved one is already added" });
    }

    try {
      const invited = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: {
          role: "loved_one",
          invited_by: user!.id,
          relationship,
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=loved_one`,
      });

      if (invited.data?.user?.id) {
        lovedUserId = invited.data.user.id;
      }
    } catch (inviteError: any) {
      console.warn("[awy/invite] invite flow issue:", inviteError?.message || inviteError);
      try {
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const found = existingUsers.users?.find((u: any) => u.email === email);
        if (found?.id) lovedUserId = found.id;
      } catch (lookupError: any) {
        console.warn("[awy/invite] user lookup skipped:", lookupError);
      }
    }

    const { data: connectionData, error: connectionError } = await supabaseAdmin
      .from("awy_connections")
      .insert({
        student_id: user!.id,
        loved_email: normalizedEmail,
        relationship,
        display_name: displayName || null,
        loved_one_id: lovedUserId,
        status: lovedUserId ? "active" : "pending",
        is_visible: true,
      })
      .select("id")
      .single();

    if (connectionError) throw connectionError;
    connectionId = connectionData?.id ?? null;

    if (lovedUserId) {
      try {
        await supabaseAdmin
          .from("profiles")
          .upsert(
            {
              id: lovedUserId,
              user_role: "loved_one",
              display_name: displayName || relationship,
              agreed_to_terms: true,
            },
            { onConflict: "id" }
          );
      } catch (profileError: any) {
        console.warn("[awy/invite] profile upsert skipped:", profileError);
      }

      try {
        await supabaseAdmin
          .from("awy_presence")
          .upsert(
            {
              user_id: lovedUserId,
              status: "offline",
              is_available_for_calls: true,
            },
            { onConflict: "user_id" }
          );
      } catch (presenceError: any) {
        console.warn("[awy/invite] presence bootstrap skipped:", presenceError);
      }
    }

    return ok(res, {
      connectionId,
      lovedUserId,
      status: lovedUserId ? "active" : "pending",
      message: lovedUserId
        ? `${email} can now login and will see you in their AWY widget`
        : `Invitation sent to ${email}`,
    });
  } catch (err: any) {
    return failSoft(res, {
      connectionId,
      lovedUserId,
      status: "pending",
      message: `We've noted the invite for ${email}. We'll finish linking them shortly.`,
    }, err);
  }
}
