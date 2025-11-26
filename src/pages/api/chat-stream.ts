import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

const SYSTEM_PROMPT =
  'You are Durmah, a friendly, succinct voice mentor for Durham law students. ' +
  'Be natural, avoid repetition, and keep answers concise unless asked for depth. ' +
  'Acknowledge when audio is still connecting, but never repeat the same listening line. ' +
  'If the user is just testing the mic, respond briefly and invite a question.';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-flash',
  systemInstruction: SYSTEM_PROMPT
});

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = req.body as { messages?: ChatMessage[] };
    const incoming = Array.isArray(body?.messages) ? body.messages : [];

    // Filter and format messages for Gemini
    // Gemini history format: { role: 'user' | 'model', parts: [{ text: string }] }
    // We need to convert 'assistant' to 'model' and 'system' is handled via systemInstruction
    const history = incoming
      .filter((msg) => msg.role !== 'system') // System prompt is set in model config
      .map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

    // The last message is the new prompt, remove it from history
    const lastMessage = history.pop();

    if (!lastMessage) {
      res.status(400).json({ error: 'No messages provided' });
      return;
    }

    const chat = model.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: 400,
        temperature: 0.7,
      },
    });

    const text = lastMessage.parts[0]?.text || '';
    if (!text) {
         res.status(400).json({ error: 'Empty message content' });
         return;
    }
    const result = await chat.sendMessageStream(text);

    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Transfer-Encoding': 'chunked',
    });

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        res.write(chunkText);
      }
    }

    res.end();
  } catch (err: any) {
    console.error('[chat-stream] error', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Chat failed', detail: err?.message || String(err) });
    } else {
      res.write('\n');
      res.write('[error]');
      res.end();
    }
  }
}
