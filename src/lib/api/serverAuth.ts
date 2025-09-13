// src/lib/api/serverAuth.ts (Pages Router)
import type { NextApiRequest, NextApiResponse } from "next";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";

export async function getServerUser(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<{ user: { id: string } | null }> {
  const supabase = createServerSupabaseClient({ req, res });
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) return { user: null };
  return { user: { id: data.user.id } };
}
