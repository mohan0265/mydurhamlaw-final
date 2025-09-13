// src/lib/api/serverAuth.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

type GotUser = { user: { id: string } | null };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Reads the current user for API routes.
 * 1) Prefer Authorization: Bearer <access_token> (what authedFetch sends)
 * 2) Fall back to Supabase cookies (browser requests)
 */
export async function getServerUser(req: NextApiRequest, res: NextApiResponse): Promise<GotUser> {
  let user: { id: string } | null = null;

  // 1) Bearer token path (recommended for /api calls from the app)
  const authz = (req.headers.authorization as string) || "";
  const isBearer = authz.startsWith("Bearer ");
  if (isBearer) {
    const accessToken = authz.slice(7);
    const supabaseSvc = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
    const { data, error } = await supabaseSvc.auth.getUser(accessToken);
    if (!error) user = (data?.user ? { id: data.user.id } : null);
    return { user };
  }

  // 2) Cookie path (SSR or direct browser hits)
  const supabaseSsr = createServerClient(SUPABASE_URL, ANON_KEY, {
    cookies: {
      get: (key) => req.cookies[key],
      set: (key, value, options) => {
        res.setHeader("Set-Cookie", `${key}=${value}; Path=/; HttpOnly; SameSite=Lax${options?.maxAge ? `; Max-Age=${options.maxAge}` : ""}`);
      },
      remove: (key, options) => {
        res.setHeader("Set-Cookie", `${key}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`);
      },
    },
  });
  const { data } = await supabaseSsr.auth.getUser();
  user = data?.user ? { id: data.user.id } : null;
  return { user };
}
