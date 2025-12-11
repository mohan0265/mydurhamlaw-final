import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";

export function getServerSupabase(req: NextApiRequest, res: NextApiResponse) {
  // Use auth-helpers to handle cookies automatically
  return createPagesServerClient({ req, res });
}

export async function getServerUser(req: NextApiRequest, res: NextApiResponse) {
  const supabase = getServerSupabase(req, res);
  
  // This automatically checks cookies and validates the session
  const { data: { user }, error } = await supabase.auth.getUser();
  
  return { user, error, supabase };
}
