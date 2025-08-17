import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: { responseLimit: false }, // allow larger audio payloads
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });

  try {
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    
    // Graceful fallback when API key is missing
    if (!ELEVENLABS_API_KEY) {
      return res.status(400).json({ 
        ok: false, 
        error: 'missing_elevenlabs_key',
        message: 'ElevenLabs API key not configured. Please set ELEVENLABS_API_KEY environment variable.'
      });
    }

    const { text, voiceId } = req.body || {};
    if (!text) return res.status(400).json({ ok: false, error: 'missing_text' });

    // Use custom voice ID if provided, otherwise default to Durmah's voice
    const VOICE_ID = voiceId || process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';

    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: text.trim(),
        model_id: process.env.ELEVENLABS_MODEL || 'eleven_turbo_v2',
        voice_settings: { 
          stability: 0.6, // Slightly more stable for professional tone
          similarity_boost: 0.8,
          style: 0.2, // Calm and measured
          use_speaker_boost: true
        },
      }),
    });

    if (!r.ok) {
      const errorText = await r.text();
      console.error('[durmah/tts] ElevenLabs API error:', r.status, errorText);
      
      if (r.status === 401) {
        return res.status(401).json({ ok: false, error: 'invalid_api_key', message: 'Invalid ElevenLabs API key' });
      } else if (r.status === 422) {
        return res.status(422).json({ ok: false, error: 'invalid_voice_id', message: 'Invalid voice ID or request parameters' });
      } else if (r.status === 429) {
        return res.status(429).json({ ok: false, error: 'rate_limit', message: 'ElevenLabs API rate limit exceeded' });
      }
      
      return res.status(500).json({ ok: false, error: 'elevenlabs_error', detail: errorText });
    }

    const buf = Buffer.from(await r.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buf.length.toString());
    res.setHeader('Cache-Control', 'no-cache'); // Don't cache voice responses
    return res.status(200).send(buf);
  } catch (err: any) {
    console.error('[durmah/tts] error', err);
    return res.status(500).json({ ok: false, error: err?.message || 'server_error' });
  }
}

