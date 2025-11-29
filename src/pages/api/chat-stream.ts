import type { NextApiRequest, NextApiResponse } from 'next';

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

    // Prepare messages for Gemini REST API
    const contents: { role: string; parts: { text: string }[] }[] = [];
    
    for (const msg of incoming) {
      if (msg.role === 'system') continue; // System prompt is handled separately
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }

    // Sanitize: Ensure first message is user
    while (contents.length > 0 && contents[0].role === 'model') {
      contents.shift();
    }

    if (contents.length === 0) {
      res.status(400).json({ error: 'No valid user messages found' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Missing GEMINI_API_KEY');
    }

    // Use v1 API and gemini-1.5-flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: 'You are Durmah, a friendly, succinct voice mentor for Durham law students. Be natural, avoid repetition, and keep answers concise unless asked for depth. Acknowledge when audio is still connecting, but never repeat the same listening line. If the user is just testing the mic, respond briefly and invite a question.' }]
        },
        generationConfig: {
          maxOutputTokens: 400,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Gemini API Error]', response.status, errorText);
      throw new Error(`Gemini API Error: ${response.status} ${errorText}`);
    }

    if (!response.body) {
      throw new Error('No response body from Gemini API');
    }

    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Transfer-Encoding': 'chunked',
    });

    // Stream parsing
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          
          try {
            const data = JSON.parse(jsonStr);
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              res.write(text);
            }
          } catch (e) {
            console.warn('Failed to parse SSE JSON:', jsonStr);
          }
        }
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
