// netlify/functions/voice-preview.js
const OpenAI = require("openai");

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { voice_id, text } = JSON.parse(event.body);

    if (!voice_id) {
      return { statusCode: 400, body: JSON.stringify({ error: "Voice ID is required" }) };
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice_id,
      input: text || "Hi, I'm Durmah. Ready to practise Durham law together?",
    });

    const buffer = Buffer.from(await response.arrayBuffer());

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "audio/mpeg",
      },
      body: buffer.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error("Voice preview error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "Failed to generate voice preview" }),
    };
  }
};
