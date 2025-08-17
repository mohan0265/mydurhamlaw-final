// Client-side API wrapper for OpenAI functionality
// All OpenAI calls go through server API routes to keep keys secure

export async function streamGPT4oResponse(prompt: string): Promise<string> {
  try {
    const response = await fetch('/api/chat-stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are Durmah, a helpful, warm law school voice assistant.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'gpt-4o',
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content || 'Sorry, something went wrong.';
  } catch (error) {
    console.error('🧠 GPT-4o streaming error:', error);
    return 'Sorry, something went wrong.';
  }
}

export async function playAssistantVoice(text: string) {
  if (!text || typeof window === 'undefined') return;

  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice: 'nova',
        model: 'tts-1',
      }),
    });

    if (!response.ok) {
      throw new Error(`TTS API error: ${response.status}`);
    }

    const blob = await response.blob();
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    audio.play();
  } catch (error) {
    console.error('🎧 TTS playback error:', error);
  }
}
