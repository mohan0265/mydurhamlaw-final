
import { Context, Config } from "@netlify/functions";

const REALTIME_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:connectRealtime";

export default async (req: Request, context: Context) => {
  console.log(`[VoiceFunction] ${req.method} request to voice-offer`);

  // Handle preflight OPTIONS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method === "GET") {
    return new Response(JSON.stringify({ status: "ok", service: "Durmah Voice (Netlify)", timestamp: new Date().toISOString() }), {
        headers: { "Content-Type": "application/json" }
    });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[VoiceFunction] GEMINI_API_KEY is not set.");
    return new Response(JSON.stringify({ error: "Gemini API key is not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const bodyText = await req.text();
    let offerSdp;
    try {
        const bodyIds = JSON.parse(bodyText);
        offerSdp = bodyIds.offerSdp;
    } catch(e) {
        // in case it came as raw text/sdp? unlikely given client
        offerSdp = bodyText; 
    }

    if (!offerSdp) {
      return new Response(JSON.stringify({ error: "Missing SDP offer" }), { status: 400 });
    }

    console.log("[VoiceFunction] Sending SDP to Gemini Realtime...");
    
    // Note: Gemini Realtime connects using the 'key' query param
    const geminiResponse = await fetch(`${REALTIME_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/sdp" },
      body: offerSdp,
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text().catch(() => "Unknown Gemini error");
      console.error(`[VoiceFunction] Gemini Error ${geminiResponse.status}: ${errorText}`);
      return new Response(JSON.stringify({ error: "Realtime upstream failed", detail: errorText }), {
        status: geminiResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const answerSdp = await geminiResponse.text();
    console.log("[VoiceFunction] Received answer from Gemini.");

    return new Response(answerSdp, {
      headers: { 
          "Content-Type": "application/sdp",
          "Access-Control-Allow-Origin": "*" 
      },
    });

  } catch (err: any) {
    console.error("[VoiceFunction] Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error", detail: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
