// src/pages/api/tts.ts
import type { NextApiRequest, NextApiResponse } from "next";

// ElevenLabs integration disabled/stubbed.
export const config = {
  api: { bodyParser: true },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  res.status(501).json({ error: "ElevenLabs TTS disabled" });
}
