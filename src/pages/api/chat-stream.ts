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

    // Prepare messages for OpenAI
    // If the first message is 'system', keep it. If not, we might want to inject one if passed separately?
    // The previous logic extracted it. Here we just pass the array as is, assuming the client constructs it correctly.
    // The client (DurmahWidget) sends [{role: 'system', content: ...}, ...history]
    
    const messages = incoming.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o", // Using gpt-4o for consistency and speed
        messages: messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI Chat Error:", response.status, errorText);
      throw new Error(`OpenAI error: ${response.statusText}`);
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    });

    if (!response.body) return;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      // OpenAI returns "data: JSON\n\n"
      // We need to parse this if we want to extract just the text, OR we can just forward the text content.
      // The client expects raw text chunks (based on previous implementation).
      // So we need to parse the SSE stream and extract delta.content.

      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const json = JSON.parse(data);
            const content = json.choices[0]?.delta?.content;
            if (content) {
              res.write(content);
            }
          } catch (e) {
            // ignore partial JSON
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
