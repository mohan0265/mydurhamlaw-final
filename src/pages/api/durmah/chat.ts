import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });

  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
    if (!OPENAI_API_KEY) return res.status(500).json({ ok: false, error: 'missing_openai_key' });

    const { messages } = req.body || {};
    if (!Array.isArray(messages)) return res.status(400).json({ ok: false, error: 'missing_messages' });

    // Add Durham Law system prompt
    const systemMessages = [
      {
        role: 'system',
        content: 'You are Durmah, an AI voice assistant for Durham Law students. Provide helpful, accurate legal guidance while encouraging academic integrity. Keep responses conversational and under 100 words for voice delivery.'
      },
      ...messages
    ];

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        messages: systemMessages,
      }),
    });

    if (!r.ok) {
      const t = await r.text();
      return res.status(500).json({ ok: false, error: 'openai_error', detail: t });
    }

    const data = await r.json();
    const text = data.choices?.[0]?.message?.content || '';
    return res.status(200).json({ ok: true, text });
  } catch (err: any) {
    console.error('[durmah/chat] error', err);
    return res.status(500).json({ ok: false, error: err?.message || 'server_error' });
  }
}

