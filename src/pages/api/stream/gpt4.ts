

import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, metadata } = req.body;

  if (!messages) {
    return res.status(400).json({ error: 'Messages are required' });
  }

  // Optional: You could add further server-side validation of metadata here

  try {
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      stream: true,
    });

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    res.end();
  } catch (error) {
    console.error('Error streaming response:', error);
    res.status(500).json({ error: 'Error streaming response' });
  }
}

