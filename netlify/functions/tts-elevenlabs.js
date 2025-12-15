// netlify/functions/tts-elevenlabs.js
export async function handler(event) {
  // ElevenLabs disabled/stubbed.
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  return { statusCode: 501, body: "ElevenLabs TTS disabled" };
}
