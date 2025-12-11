import type { NextApiRequest, NextApiResponse } from "next";

const REALTIME_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:connectRealtime";

export const config = {
  maxDuration: 60, // Serverless function timeout
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log(`[VoiceAPI] ${req.method} request to /api/voice/offer`);

  // Allow simple GET check to confirm endpoint exists
  if (req.method === 'GET') {
     return res.status(200).json({ status: "ok", service: "Durmah Voice", timestamp: new Date().toISOString() });
  }

  if (req.method !== "POST") {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
    return;
  }

  const apiKey =
    process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    console.error("[VoiceAPI] GEMINI_API_KEY is not set.");
    res.status(500).json({ error: "Gemini API key is not configured (Server)" });
    return;
  }

  try {
    const { offerSdp } = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    if (!offerSdp || typeof offerSdp !== "string") {
      console.warn("[VoiceAPI] Missing SDP offer in body");
      res.status(400).json({ error: "Missing SDP offer" });
      return;
    }

    console.log("[VoiceAPI] Sending SDP to Gemini Realtime...");

    const response = await fetch(`${REALTIME_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/sdp" },
      body: offerSdp,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "Realtime request failed");
      console.error(`[VoiceAPI] Gemini Error ${response.status}: ${text}`);
      res
        .status(response.status)
        .json({ error: "Realtime request failed", detail: text });
      return;
    }

    console.log("[VoiceAPI] Received SDP answer from Gemini.");
    const answerSdp = await response.text();
    res.setHeader("Content-Type", "text/plain");
    res.status(200).send(answerSdp);
  } catch (error: any) {
    console.error("[VoiceAPI] Unexpected error:", error);
    res
      .status(500)
      .json({ error: "Realtime negotiation failed", detail: error?.message });
  }
}
