// src/lib/api/serverAuth.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";

export async function getServerUser(req: NextApiRequest, res: NextApiResponse) {
  // 1) Try cookie-based auth (works when cookies flow in)
  const sbFromCookies = createServerSupabaseClient({ req, res });
  let { data: cookieUser } = await sbFromCookies.auth.getUser();
  if (cookieUser?.user) {
    return { supabase: sbFromCookies, user: cookieUser.user };
  }

  // 2) Fallback: Bearer token from client
  const authz = req.headers.authorization;
  const token = authz?.startsWith("Bearer ") ? authz.slice(7) : null;
  if (token) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data, error } = await admin.auth.getUser(token);
    if (data?.user && !error) {
      // Return an admin client + user for downstream usage.
      // IMPORTANT: Use RLS-safe queries or explicit checks before writes.
      return { supabase: admin, user: data.user };
    }
  }

  return { supabase: sbFromCookies, user: null };
}
