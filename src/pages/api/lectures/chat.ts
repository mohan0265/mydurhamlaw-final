
import { type NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { openai } from '@/server/openai';

export const runtime = 'edge';

export default async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { messages, lectureId } = await req.json();

    if (!lectureId || !messages) {
      return new NextResponse('Missing fields', { status: 400 });
    }

    // 1. Fetch Lecture Context (Transcript & Notes)
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
        return new NextResponse('Lecture not found', { status: 404 });
    }

    // 2. Construct System Prompt
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

    // 3. Prepare Messages
    const conversation = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    // 4. Stream Response
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: conversation,
      stream: true,
    });

    // Create a ReadableStream from the OpenAI stream
    const stream = new ReadableStream({
      async start(controller) {
        for await (const part of response) {
          const content = part.choices[0]?.delta?.content || '';
          if (content) {
            controller.enqueue(new TextEncoder().encode(content));
          }
        }
        controller.close();
      },
    });

    // 5. Fire-and-forget DB save (User message)
    // Note: In an edge function, we might need to handle this carefully.
    // Ideally, we'd wait, but for speed we can try Promise.all if not streaming,
    // or just let the client save the user message, or do it before streaming.
    // For this implementation, we will assume client saves user message optimistically,
    // and we just return the AI stream.
    // A robust solution would use a separate backend function to save history.
    
    // Let's at least insert the user message *before* streaming if possible, 
    // but with Edge functions, keeping the connection open for DB might be tricky during stream.
    // We will save USER message now.
    const lastUserMsg = messages[messages.length - 1];
    if (lastUserMsg.role === 'user') {
       await supabase.from('lecture_chat_messages').insert({
           user_id: user.id,
           lecture_id: lectureId,
           role: 'user',
           content: lastUserMsg.content
       });
    }

    return new NextResponse(stream);

  } catch (error: any) {
    console.error('Chat error:', error);
    return new NextResponse(error.message || 'Internal Error', { status: 500 });
  }
}
