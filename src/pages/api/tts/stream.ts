// src/pages/api/tts/stream.ts
import type { NextApiRequest, NextApiResponse } from "next";

// ElevenLabs streaming TTS disabled/stubbed.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  return res.status(501).json({ error: "ElevenLabs TTS disabled" });
}
