// src/pages/api/tts/stream.ts
import type { NextApiRequest, NextApiResponse } from "next";

const ELEVEN_API = "https://api.elevenlabs.io/v1/text-to-speech";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { text, voiceId } = req.body as { text?: string; voiceId?: string };
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const defaultVoice = process.env.ELEVENLABS_DEFAULT_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // Rachel
    const modelId = process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2";

    if (!apiKey) return res.status(500).json({ error: "ELEVENLABS_API_KEY missing" });
    if (!text || !text.trim()) return res.status(400).json({ error: "text required" });

    const resp = await fetch(`${ELEVEN_API}/${voiceId || defaultVoice}/stream?optimize_streaming_latency=2`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
      },
      body: JSON.stringify({
        text: text.trim(),
        model_id: modelId,
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });

    if (!resp.ok) {
      const errTxt = await resp.text().catch(() => "");
      return res.status(resp.status).json({ error: "ElevenLabs error", details: errTxt });
    }

    // Pipe audio back
    const arrayBuf = await resp.arrayBuffer();
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    return res.send(Buffer.from(arrayBuf));
  } catch (e: any) {
    console.error("[/api/tts/stream] fail:", e);
    return res.status(500).json({ error: "tts_failed" });
  }
}
