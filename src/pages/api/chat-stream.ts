import type { NextApiRequest, NextApiResponse } from 'next';
import { getDurmahModel } from '@/lib/geminiClient';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };


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

    if (incoming.length === 0) {
      res.status(400).json({ error: 'No messages provided' });
      return;
    }

    // Filter and format messages for Gemini
    // Gemini requires the first history message to be 'user'.
    const history: { role: string; parts: { text: string }[] }[] = [];
    
    for (const msg of incoming) {
      if (msg.role === 'system') continue;
      history.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }

    // The last message is the new prompt
    const lastMessage = history.pop();
    if (!lastMessage || !lastMessage.parts[0]?.text) {
      res.status(400).json({ error: 'Empty message content' });
      return;
    }

    // Sanitize history: remove leading model messages
    while (history.length > 0 && history[0].role === 'model') {
      history.shift();
    }

    const model = getDurmahModel();

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
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Chat failed', 
        detail: err?.message || String(err) 
      });
    } else {
      res.end();
    }
  }
}
