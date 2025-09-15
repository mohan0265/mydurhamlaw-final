// src/lib/api/serverAuth.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createServerClient } from "@supabase/ssr";

export function getServerSupabase(req: NextApiRequest, res: NextApiResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies[name],
        set: (name, value, options) => {
          const parts = [
            `${name}=${value}`,
            `Path=${options?.path ?? "/"}`,
            "HttpOnly",
            "SameSite=Lax",
            "Secure",
          ];
          if (options?.maxAge) parts.push(`Max-Age=${options.maxAge}`);
          res.setHeader("Set-Cookie", parts.join("; "));
        },
        remove: (name, options) => {
          const parts = [
            `${name}=`,
            `Path=${options?.path ?? "/"}`,
            "Max-Age=0",
            "HttpOnly",
            "SameSite=Lax",
            "Secure",
          ];
          res.setHeader("Set-Cookie", parts.join("; "));
        },
      },
    }
  );
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

  // Otherwise fall back to cookie flow
  const { data, error } = await supabase.auth.getUser();
  return { user: data?.user ?? null, error, supabase };
}
