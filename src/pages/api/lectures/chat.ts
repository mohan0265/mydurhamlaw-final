
import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { openai } from '@/server/openai';

// Force Node.js runtime (default)
// export const runtime = 'edge'; // REMOVED

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createPagesServerClient({ req, res });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { messages, lectureId } = req.body;

    if (!lectureId || !messages) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    // 1. Fetch Lecture Context
    const { data: lecture, error: lectError } = await supabase
      .from('lectures')
      .select(`
        title,
        module_code,
        lecture_transcripts (transcript_text),
        lecture_notes (summary, key_points)
      `)
      .eq('id', lectureId)
      .single();

    if (lectError || !lecture) {
        return res.status(404).json({ error: 'Lecture not found' });
    }

    // 2. System Prompt
    const transcript = lecture.lecture_transcripts?.transcript_text || '';
    const summary = lecture.lecture_notes?.summary || '';
    const keyPoints = lecture.lecture_notes?.key_points || [];

    const systemPrompt = `You are Durmah, a legal study assistant for Durham Law students.
You are helping the student with the lecture "${lecture.title}" (${lecture.module_code || 'Unknown Module'}).

CONTEXT:
Summary: ${summary}
Key Points: ${keyPoints.join('; ')}
Transcript Excerpt (First 5000 chars): ${transcript.slice(0, 5000)}

INSTRUCTIONS:
- Answer questions based on the lecture content provided.
- If the answer isn't in the context, say so but provide general legal guidance if possible (noting it's outside the lecture).
- Be encouraging and structured (IRAC method where supporting).
- Keep answers concise.`;

    // 3. Messages
    const conversation = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    // 4. Create OpenAI Stream
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: conversation as any,
      stream: true,
    });

    // 5. Save USER message to DB (async, fire-and-forget or await)
    // We await it to ensure it's saved.
    const lastUserMsg = messages[messages.length - 1];
    if (lastUserMsg.role === 'user') {
       await supabase.from('lecture_chat_messages').insert({
           user_id: user.id,
           lecture_id: lectureId,
           role: 'user',
           content: lastUserMsg.content
       });
    }

    // 6. Stream back to client
    // Set headers for SSE-like streaming
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    });

    for await (const part of response) {
      const content = part.choices[0]?.delta?.content || '';
      if (content) {
        // We write raw content (client decoder handles it)
        res.write(content);
      }
    }

    res.end();

  } catch (error: any) {
    console.error('Chat error:', error);
    // If headers already sent, we can't send JSON error, so check:
    if (!res.headersSent) {
        res.status(500).json({ error: error.message || 'Internal Error' });
    } else {
        res.end();
    }
  }
}
