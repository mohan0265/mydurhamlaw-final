import { streamGPT4oResponse } from '@/lib/server/openai'

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { messages } = await req.json()
    
    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid messages format', { status: 400 })
    }

    // Add wellbeing-specific system prompt
    const wellbeingMessages = [
      {
        role: 'system',
        content: `You are a supportive wellbeing coach for law students at Durham University. 
        
Your role is to provide:
- Practical wellness advice for academic stress
- Study-life balance strategies
- Sleep optimization tips for law students
- Nutrition guidance for sustained energy
- Exercise routines that fit busy schedules
- Mindfulness and stress management techniques
- Mental health support and encouragement

Always be:
- Warm, empathetic, and understanding
- Practical with actionable advice
- Supportive of the demanding nature of law studies
- Encouraging about sustainable habits
- Mindful of the unique pressures law students face

Keep responses conversational, supportive, and focused on practical wellbeing strategies.`
      },
      ...messages
    ]

    const stream = await streamGPT4oResponse(wellbeingMessages)
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Wellbeing coach streaming error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}