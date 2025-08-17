/**
 * Voice TTS API Proxy - Server-side ElevenLabs streaming  
 * GET /api/voice/tts?text=Hello from Durmah
 */

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    const VOICE_ID = process.env.ELEVENLABS_DEFAULT_VOICE_ID || 'Rachel';
    const MODEL = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';
    
    if (!ELEVENLABS_API_KEY) {
      console.error('TTS_ERR: No ELEVENLABS_API_KEY');
      return res.status(500).json({ error: 'ElevenLabs API key not configured' });
    }

    const text = (req.query.text as string) || '';
    if (!text.trim()) {
      return res.status(400).json({ error: 'Missing text parameter' });
    }

    console.log('TTS_START:', text.substring(0, 50));

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text: text.trim(),
        model_id: MODEL,
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.7,
          style: 0.0,
          use_speaker_boost: true
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('TTS_ERR:', response.status, errorText);
      return res.status(502).json({ 
        error: 'ElevenLabs API error',
        detail: `${response.status}: ${errorText}`
      });
    }

    // Set audio headers and stream
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-cache');
    
    const reader = response.body?.getReader();
    if (!reader) {
      return res.status(502).json({ error: 'No audio stream' });
    }

    try {
      let done = false;
      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        
        if (value) {
          res.write(Buffer.from(value));
        }
      }
      
      console.log('TTS_OK:', text.length, 'chars');
      res.end();
      
    } finally {
      reader.releaseLock();
    }

  } catch (error) {
    console.error('TTS_ERR:', error);
    return res.status(500).json({ 
      error: 'TTS proxy error',
      detail: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}