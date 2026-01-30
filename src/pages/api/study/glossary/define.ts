import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import OpenAI from "openai";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { term } = req.body;
  if (!term || typeof term !== "string") {
    return res.status(400).json({ error: "Term is required" });
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

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `You are a legal education AI. Provide a clear, accurate, and student-friendly legal definition for the term: "${term}". 
    The definition should be concise (max 300 characters) and suitable for a law student's glossary. 
    If the term is not a legal term or is nonsensical, respond with "NOT_LEGAL".`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 150,
    });

    const definition = completion.choices[0]?.message?.content?.trim() || "";

    if (definition === "NOT_LEGAL") {
      return res
        .status(400)
        .json({
          error:
            "This term does not appear to be a recognized legal concept. Please try a different term.",
        });
    }

    return res.status(200).json({ term, definition });
  } catch (error: any) {
    console.error("[glossary/define] Error:", error);
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
}
