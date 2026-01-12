import type { NextApiRequest, NextApiResponse } from "next";
import { DEFAULT_TZ, formatNowPacket } from "@/lib/durmah/timezone";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const REALTIME_MODEL =
  process.env.OPENAI_REALTIME_MODEL ||
  "gpt-4o-realtime-preview-2024-12-17";
const TRANSCRIPTION_MODEL =
  process.env.OPENAI_TRANSCRIPTION_MODEL || "gpt-4o-mini-transcribe";
const ENGLISH_SYSTEM_INSTRUCTION =
  "You are Durmah, an English-only legal mentor. Always transcribe and respond in English suitable for a Durham law student, even if the user speaks another language. Do not output Malay or any other language.";

export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 60,
};

async function readRawBody(req: NextApiRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    });
    req.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
    req.on("error", reject);
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log(`[VoiceAPI] ${req.method} request to /api/voice/offer`);

  // Allow simple GET check to confirm endpoint exists
  if (req.method === "GET") {
    return res
      .status(200)
      .json({
        status: "ok",
        service: "Durmah Voice",
        timestamp: new Date().toISOString(),
      });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST", "GET"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  if (!OPENAI_API_KEY) {
    console.error("[VoiceAPI] OPENAI_API_KEY is not set.");
    return res.status(500).json({ error: "OPENAI_API_KEY not configured" });
  }

  try {
    const offerSdp = req.method === "POST" ? await readRawBody(req) : "";

    if (!offerSdp || typeof offerSdp !== "string") {
      console.warn("[VoiceAPI] Missing SDP offer in body");
      return res.status(400).json({ error: "Missing SDP offer" });
    }

    const requestedVoiceHeader = req.headers["x-durmah-voice"];
    const requestedVoice = Array.isArray(requestedVoiceHeader)
      ? requestedVoiceHeader[0]
      : requestedVoiceHeader;

    console.log("[VoiceAPI] Creating OpenAI Realtime session...");

    // TIMEZONE TRUTH: Use shared helper for consistent date/time
    const nowPacket = formatNowPacket(new Date(), DEFAULT_TZ);
    console.log(`[VoiceAPI] NOW: ${nowPacket.nowText}`);
    
    // Keep voice session instructions SIMPLE - detailed context comes from session.update
    const enhancedInstructions = `${ENGLISH_SYSTEM_INSTRUCTION}

CURRENT TIME: ${nowPacket.nowText} (UK timezone)
If asked the date/time, say: "${nowPacket.nowText}"

Keep responses SHORT (2-3 sentences for voice).
ONLY transcribe English. Ask to repeat if unclear.`;

    const sessionPayload: Record<string, unknown> = {
      model: REALTIME_MODEL,
      instructions: enhancedInstructions,
      input_audio_transcription: {
        model: TRANSCRIPTION_MODEL,
        language: "en",
      },
      // PATIENCE FIX: Make Durmah wait for user to finish speaking
      turn_detection: {
        type: "server_vad",
        threshold: 0.6,           // Higher = less sensitive to speech (0.0-1.0)
        prefix_padding_ms: 400,   // Audio to include before speech detected
        silence_duration_ms: 1200, // Wait 1.2s of silence before responding (default ~500ms)
        create_response: true,    // Auto-respond after detecting silence
      },
    };
    if (requestedVoice && typeof requestedVoice === "string") {
      sessionPayload.voice = requestedVoice;
    }

    const sessionRes = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sessionPayload),
    });

    if (!sessionRes.ok) {
      const text = await sessionRes.text();
      console.error(
        "[VoiceAPI] Failed to create OpenAI Realtime session",
        sessionRes.status,
        text
      );
      return res.status(502).json({
        error: "Failed to create Realtime session",
        status: sessionRes.status,
        details: text,
      });
    }

    const sessionJson = await sessionRes.json();
    const ephemeralKey =
      sessionJson?.client_secret?.value ??
      sessionJson?.client_secret ??
      null;

    if (!ephemeralKey || typeof ephemeralKey !== "string") {
      console.error(
        "[VoiceAPI] Realtime session missing client secret",
        sessionJson
      );
      return res
        .status(502)
        .json({ error: "Realtime session missing client secret" });
    }

    const realtimeUrl = `https://api.openai.com/v1/realtime?model=${encodeURIComponent(
      REALTIME_MODEL
    )}`;

    const response = await fetch(realtimeUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ephemeralKey}`,
        "Content-Type": "application/sdp",
      },
      body: offerSdp,
    });

    const answerSdp = await response.text();

    if (!response.ok) {
      console.error(
        "[VoiceAPI] Realtime SDP exchange failed",
        response.status,
        answerSdp
      );
      return res
        .status(response.status || 502)
        .send(answerSdp || "Realtime SDP exchange failed");
    }

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(answerSdp);
  } catch (error: any) {
    console.error("[VoiceAPI] Unexpected error:", error);
    return res.status(500).json({
      error: "Internal server error in voice offer endpoint",
      detail: error?.message,
    });
  }
}
