/**
 * Voice Chat API - POST {sessionId, messages:[{role,content}]}
 * Route to OpenAI chat (4o-mini). Return {text}. Save to Supabase if tables exist.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  sessionId: string;
  messages: ChatMessage[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId, messages }: ChatRequest = req.body;

    if (!sessionId || !messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'sessionId and messages array required' });
    }

    if (messages.length === 0) {
      return res.status(400).json({ error: 'No messages provided' });
    }

    console.log('CHAT_START:', sessionId, messages.length, 'messages');

    // Add Durham Law system prompt for academic context
    const systemMessages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are Durmah, an AI voice assistant for Durham Law students. Provide helpful, accurate legal guidance while encouraging academic integrity. Keep responses conversational and under 100 words for voice delivery.'
      },
      ...messages
    ];

    // Route to OpenAI GPT-4o-mini
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: systemMessages,
      temperature: 0.7,
      max_tokens: 300,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || 'I apologize, I could not process your request.';
    console.log('CHAT_OK:', responseText.length, 'chars');

    // Save conversation to Supabase if available (defensive)
    try {
      const { supabaseStore } = await import('../../../lib/voice/supabaseStore');
      
      // Get the last user message to save
      const lastUserMessage = messages.filter(m => m.role === 'user').pop();
      if (lastUserMessage) {
        await supabaseStore.appendMessage(sessionId, 'user', lastUserMessage.content);
      }
      
      // Save assistant response
      await supabaseStore.appendMessage(sessionId, 'assistant', responseText);
      console.log('CHAT_DB_OK:', sessionId);
      
    } catch (dbError) {
      console.warn('CHAT_DB_WARN:', dbError);
      // Continue without throwing - voice should work even if DB fails
    }

    return res.status(200).json({
      text: responseText,
      sessionId
    });

  } catch (error) {
    console.error('CHAT_ERR:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }
      
      return res.status(500).json({ 
        error: 'Chat failed',
        detail: error.message
      });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}

