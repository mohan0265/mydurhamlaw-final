/**
 * Voice Transcription API - POST multipart/form-data "audio"
 * Uses OpenAI Whisper to transcribe audio, returns {text}
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import formidable from 'formidable';
import fs from 'node:fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let tempFilePath: string | null = null;

  try {
    console.log('STT_START');

    const form = formidable({ 
      multiples: false,
      maxFileSize: 25 * 1024 * 1024,
      keepExtensions: true,
      uploadDir: '/tmp'
    });

    const [fields, files] = await form.parse(req);

    if (!files || !files.audio) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;
    if (!audioFile?.filepath) {
      return res.status(400).json({ error: 'Invalid audio file' });
    }

    tempFilePath = audioFile.filepath;
    const fileSize = fs.statSync(tempFilePath).size;
    
    console.log('STT_FILE:', fileSize, 'bytes');

    if (fileSize < 100) {
      console.log('STT_TOO_SHORT');
      return res.status(200).json({ text: '' });
    }

    // Transcribe with Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: 'whisper-1',
      language: 'en',
      response_format: 'json',
      temperature: 0.0
    });

    const text = transcription.text?.trim() || '';
    console.log('STT_OK:', text.length, 'chars');

    return res.status(200).json({ text });

  } catch (error) {
    console.error('STT_ERR:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }
      
      return res.status(500).json({ 
        error: 'Transcription failed',
        detail: error.message
      });
    }

    return res.status(500).json({ error: 'Internal server error' });
    
  } finally {
    if (tempFilePath) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.warn('STT_CLEANUP_WARN:', cleanupError);
      }
    }
  }
}

/**
 * Alternative handler for direct audio buffer (if needed)
 */
export async function transcribeAudioBuffer(audioBuffer: Buffer): Promise<string> {
  try {
    const tempPath = `/tmp/audio_${Date.now()}.webm`;
    fs.writeFileSync(tempPath, audioBuffer);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempPath),
      model: 'whisper-1',
      language: 'en',
      response_format: 'json',
      temperature: 0.0,
    });

    // Clean up
    fs.unlinkSync(tempPath);

    return transcription.text || '';
  } catch (error) {
    console.error('DURMAH_STT_BUFFER_ERR:', error);
    throw error;
  }
}