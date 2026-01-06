exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { voice } = JSON.parse(event.body || '{}');

    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: voice || "cedar", // Cedar for natural voice, fallback to marin if not available
        modalities: ["audio", "text"], // Enable both audio and text for transcription
        temperature: 0.65,
        max_response_output_tokens: 320,
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        // Enable input audio transcription for live transcript display
        input_audio_transcription: {
          model: "whisper-1"
        },
        // Semantic VAD for natural turn detection with barge-in support
        turn_detection: {
          type: "server_vad", // OpenAI uses server_vad
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500, // Lower for more responsive turn-taking
          create_response: true
        }
      }),
    });

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (err) {
    console.error("Realtime token function error:", err);
    return { statusCode: 500, body: "Error creating realtime session" };
  }
};
