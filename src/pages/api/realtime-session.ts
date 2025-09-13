import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const key = process.env.OPENAI_API_KEY;
    if (!key) return res.status(500).json({ error: "Missing OPENAI_API_KEY" });

    // Return the shape your hooks expect: { token, model }
    // Dev/staging: we return the API key as the token. For production we'll
    // switch to OpenAI ephemeral sessions or a proxy.
    res.status(200).json({
      token: key,
      model: "gpt-4o-realtime-preview-2024-12-17",
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "server error" });
  }
}
