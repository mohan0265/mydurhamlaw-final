// src/lib/api/serverAuth.ts
import type { NextApiRequest, NextApiResponse } from "next";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";

export type ServerAuth = {
  supabase: SupabaseClient;
  user: User | null;
};

/**
 * Looks for Authorization: Bearer <access_token> first (for authedFetch)
 * then falls back to reading Supabase cookies (normal browser requests).
 * Returns a Supabase client you can use on the server and the authed user.
 */
export async function getServerUser(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<ServerAuth> {
  const authz = (req.headers.authorization as string) || "";
  const token = authz.startsWith("Bearer ") ? authz.slice(7) : "";

  // Prefer bearer token (works with authedFetch on the client)
  if (token) {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (data?.user && !error) {
      const sb = createServerSupabaseClient({ req, res }) as unknown as SupabaseClient;
      return { supabase: sb, user: data.user };
    }
  }

  // Fallback to cookie-based session (normal browser request)
  const sb = createServerSupabaseClient({ req, res }) as unknown as SupabaseClient;
  const { data } = await sb.auth.getUser();
  return { supabase: sb, user: data?.user ?? null };
}
