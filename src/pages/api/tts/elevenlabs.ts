import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import ElevenLabs from 'elevenlabs-node';

const elevenLabs = new ElevenLabs({
    apiKey: process.env.ELEVENLABS_API_KEY || "",
});

const requestSchema = z.object({
    text: z.string(),
    voiceId: z.string().optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid request body' });
    }

    const { text, voiceId } = parsed.data;

    try {
        const voiceStream = await elevenLabs.textToSpeechStream({
            textInput: text,
            voiceId: voiceId || process.env.ELEVENLABS_DEFAULT_VOICE_ID || '21m00Tcm4TlvDq8ikWAM',
            modelId: process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2',
        });

        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'no-store');
        res.writeHead(200);

        voiceStream.on('data', (chunk: Buffer) => {
            res.write(chunk);
        });

        voiceStream.on('end', () => {
            res.end();
        });

        voiceStream.on('error', (error: Error) => {
            console.error('ElevenLabs stream error:', error);
        });

    } catch (error) {
        console.error('Error streaming TTS:', error);
        res.status(500).json({ error: 'Error streaming TTS' });
    }
}
