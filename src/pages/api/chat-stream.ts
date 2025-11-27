import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

const SYSTEM_PROMPT =
  'You are Durmah, a friendly, succinct voice mentor for Durham law students. ' +
  'Be natural, avoid repetition, and keep answers concise unless asked for depth. ' +
  'Acknowledge when audio is still connecting, but never repeat the same listening line. ' +
  'If the user is just testing the mic, respond briefly and invite a question.';


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

  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[chat-stream] Missing GEMINI_API_KEY');
    res.status(500).json({ error: 'Server configuration error: Missing API Key' });
    return;
  }

  try {
    const body = req.body as { messages?: ChatMessage[] };
    const incoming = Array.isArray(body?.messages) ? body.messages : [];

    if (incoming.length === 0) {
      res.status(400).json({ error: 'No messages provided' });
      return;
    }

    // Filter and format messages for Gemini
    let history = incoming
      .filter((msg) => msg.role !== 'system')
      .map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

    // The last message is the new prompt
    const lastMessage = history.pop();
    if (!lastMessage || !lastMessage.parts[0]?.text) {
      res.status(400).json({ error: 'Empty message content' });
      return;
    }

    // Gemini requires the first history message to be 'user'.
    // If the conversation started with an assistant greeting, remove it.
    while (history.length > 0 && history[0].role === 'model') {
      history.shift();
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash-latest',
      systemInstruction: SYSTEM_PROMPT
    });

    const chat = model.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: 400,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessageStream(lastMessage.parts[0].text);

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
    console.error('[chat-stream] error:', err);
    // If headers haven't been sent, return JSON error
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Chat failed', 
        detail: err?.message || String(err) 
      });
    } else {
      // If streaming started, we can't send JSON, so just end the stream
      console.error('[chat-stream] Stream interrupted by error');
      res.end();
    }
  }
}
