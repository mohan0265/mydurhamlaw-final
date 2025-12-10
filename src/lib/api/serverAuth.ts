// src/lib/api/serverAuth.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getSupabaseClient } from "@/lib/supabase/client";

export function getServerSupabase(req: NextApiRequest, res: NextApiResponse) {
  return getSupabaseClient();
}

export async function getServerUser(req: NextApiRequest, res: NextApiResponse) {
  const supabase = getServerSupabase(req, res);

  // If a Bearer token is present, trust it explicitly
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const { data, error } = await supabase.auth.getUser(token);
    return { user: data?.user ?? null, error, supabase };
  }

  // NOTE: Universal client does not automatically handle cookies.
  // If relying on cookies, we'd need manual parsing here or sticking with token auth.
  // For now, attempting getUser() which will likely fail without session persistence/cookies
  // but strictly follows "remove @supabase/ssr" directive.
  const { data, error } = await supabase.auth.getUser();
  return { user: data?.user ?? null, error, supabase };
}
