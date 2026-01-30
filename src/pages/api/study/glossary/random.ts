import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabase = createPagesServerClient({ req, res });
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get a random term from the user's glossary
    // In Postgres, we use RANDOM() or TABLESAMPLE
    // Simplest for small lists is ordering by random()
    const { data: terms, error } = await supabase
      .from("glossary_terms")
      .select("term, definition")
      .eq("user_id", user.id)
      .limit(1)
      .order("id", { ascending: false }); // Fallback sorting

    // For real random, we might need a raw RPC or just fetch a count and offset
    // But limit(1) by random is easiest if we use a raw query or just a random offset

    // Let's try to get a random one by getting count first
    const { count, error: countError } = await supabase
      .from("glossary_terms")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (countError) throw countError;

    if (!count || count === 0) {
      return res.status(200).json(null);
    }

    const randomOffset = Math.floor(Math.random() * count);

    const { data: randomTerm, error: termError } = await supabase
      .from("glossary_terms")
      .select("term, definition")
      .eq("user_id", user.id)
      .range(randomOffset, randomOffset)
      .single();

    if (termError) throw termError;

    return res.status(200).json(randomTerm);
  } catch (error: any) {
    console.error("[glossary/random] Error:", error);
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
}
