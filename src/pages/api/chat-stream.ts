import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

type StreamChunk = {
  choices?: Array<{
    delta?: { content?: string };
  }>;
};

const SYSTEM_PROMPT =
  'You are Durmah, a friendly, succinct voice mentor for Durham law students. ' +
  'Be natural, avoid repetition, and keep answers concise unless asked for depth. ' +
  'Acknowledge when audio is still connecting, but never repeat the same listening line. ' +
  'If the user is just testing the mic, respond briefly and invite a question.';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

    const sanitized: ChatMessage[] = incoming
      .filter((message) => message && typeof message.content === 'string')
      .map((message) => {
        const allowedRoles: Array<ChatMessage['role']> = ['system', 'user', 'assistant'];
        const role = allowedRoles.includes(message.role) ? message.role : 'user';
        return { role, content: message.content.trim() };
      });

    const hasSystem = sanitized.some((message) => message.role === 'system');
    const messages: ChatMessage[] = hasSystem
      ? [...sanitized]
      : [{ role: 'system', content: SYSTEM_PROMPT }, ...sanitized];

    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Transfer-Encoding': 'chunked',
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.6,
      max_tokens: 400,
      stream: true,
    });

    const stream = completion as AsyncIterable<StreamChunk>;
    for await (const part of stream) {
      const token = part?.choices?.[0]?.delta?.content ?? '';
      if (token) {
        res.write(token);
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
