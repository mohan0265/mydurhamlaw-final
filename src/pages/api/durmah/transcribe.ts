import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: { bodyParser: false }, // we will read the stream ourselves
};

async function streamToBuffer(stream: NodeJS.ReadableStream) {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });

  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    // Graceful fallback when API key is missing
    if (!OPENAI_API_KEY) {
      return res.status(400).json({ 
        ok: false, 
        error: 'missing_openai_key',
        message: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.'
      });
    }

    const audioBuf = await streamToBuffer(req);
    
    // Validate audio buffer
    if (!audioBuf || audioBuf.length === 0) {
      return res.status(400).json({ ok: false, error: 'empty_audio', message: 'No audio data received' });
    }
    
    if (audioBuf.length > 25 * 1024 * 1024) { // 25MB limit
      return res.status(413).json({ ok: false, error: 'audio_too_large', message: 'Audio file too large (max 25MB)' });
    }

    const form = new FormData();
    form.append('file', new Blob([audioBuf], { type: 'audio/webm' }), 'audio.webm');
    form.append('model', 'whisper-1');
    form.append('language', 'en'); // Optimize for English
    form.append('response_format', 'json');
    form.append('temperature', '0'); // More deterministic results

    const r = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: form as any,
    });

    if (!r.ok) {
      const errorText = await r.text();
      console.error('[durmah/transcribe] OpenAI API error:', r.status, errorText);
      
      if (r.status === 401) {
        return res.status(401).json({ ok: false, error: 'invalid_api_key', message: 'Invalid OpenAI API key' });
      } else if (r.status === 413) {
        return res.status(413).json({ ok: false, error: 'audio_too_large', message: 'Audio file too large for processing' });
      } else if (r.status === 429) {
        return res.status(429).json({ ok: false, error: 'rate_limit', message: 'OpenAI API rate limit exceeded' });
      }
      
      return res.status(500).json({ ok: false, error: 'openai_error', detail: errorText });
    }

    const data = await r.json();
    const transcribedText = data.text || '';
    
    // Clean up transcription (remove excessive whitespace, normalize)
    const cleanText = transcribedText.trim().replace(/\s+/g, ' ');
    
    return res.status(200).json({ 
      ok: true, 
      text: cleanText,
      confidence: data.confidence || null,
      language: data.language || 'en'
    });
  } catch (err: any) {
    console.error('[durmah/transcribe] error', err);
    
    if (err.name === 'AbortError') {
      return res.status(499).json({ ok: false, error: 'request_cancelled' });
    }
    
    return res.status(500).json({ ok: false, error: err?.message || 'server_error' });
  }
}

