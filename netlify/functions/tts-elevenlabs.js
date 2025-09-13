// netlify/functions/tts-elevenlabs.js
export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { voice_id, text, model_id, voice_settings } = JSON.parse(event.body || "{}");

  if (!voice_id || !text) {
    return { statusCode: 400, body: "Missing voice_id or text" };
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: "ELEVENLABS_API_KEY not set in environment" };
  }

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`;

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: model_id || process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2",
        voice_settings: voice_settings || {
          stability: 0.45,
          similarity_boost: 0.85,
          style: 0.35,
          use_speaker_boost: true,
        },
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      return { statusCode: resp.status, body: err };
    }

    const arrayBuffer = await resp.arrayBuffer();
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "audio/mpeg",
      },
      body: Buffer.from(arrayBuffer).toString("base64"),
      isBase64Encoded: true,
    };
  } catch (err) {
    return { statusCode: 500, body: `Error: ${err.message}` };
  }
}
