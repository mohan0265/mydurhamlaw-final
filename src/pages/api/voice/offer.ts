import type { NextApiRequest, NextApiResponse } from "next";

const REALTIME_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:connectRealtime";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey =
    process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    res.status(500).json({ error: "Gemini API key is not configured" });
    return;
  }

  try {
    const { offerSdp } = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    if (!offerSdp || typeof offerSdp !== "string") {
      res.status(400).json({ error: "Missing SDP offer" });
      return;
    }

    const response = await fetch(`${REALTIME_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/sdp" },
      body: offerSdp,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "Realtime request failed");
      res
        .status(response.status)
        .json({ error: "Realtime request failed", detail: text });
      return;
    }

    const answerSdp = await response.text();
    res.setHeader("Content-Type", "text/plain");
    res.status(200).send(answerSdp);
  } catch (error: any) {
    res
      .status(500)
      .json({ error: "Realtime negotiation failed", detail: error?.message });
  }
}
