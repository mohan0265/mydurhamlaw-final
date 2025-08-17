// src/pages/api/tts.ts
import type { NextApiRequest, NextApiResponse } from "next";

const ELEVEN_API_KEY = process.env.ELEVENLABS_API_KEY!;
const ELEVEN_VOICE_ID = process.env.ELEVENLABS_DEFAULT_VOICE_ID!;
const ELEVEN_MODEL = process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2";

export const config = {
  api: { bodyParser: true },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { text } = req.body as { text?: string };
    if (!text || !text.trim()) {
      res.status(400).json({ error: "Missing text" });
      return;
    }
    if (!ELEVEN_API_KEY || !ELEVEN_VOICE_ID) {
      res.status(500).json({ error: "ElevenLabs env not configured" });
      return;
    }

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE_ID}`;
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVEN_API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: ELEVEN_MODEL,
        voice_settings: { stability: 0.5, similarity_boost: 0.6 },
      }),
    });

    if (!r.ok) {
      const errTxt = await r.text().catch(() => "");
      console.error("[tts] ElevenLabs error", r.status, errTxt);
      res.status(502).json({ error: "TTS failed", status: r.status, detail: errTxt });
      return;
    }

    const buf = Buffer.from(await r.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", buf.length.toString());
    res.status(200).send(buf);
  } catch (err: any) {
    console.error("[tts] error", err);
    res.status(500).json({ error: "TTS endpoint error", detail: err?.message ?? String(err) });
  }
}
