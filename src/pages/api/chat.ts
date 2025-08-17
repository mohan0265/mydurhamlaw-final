// /pages/api/chat.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { buildMemoryAwarePrompt } from '@/lib/prompts/MemoryManagerAgent/prompt'
import { openai } from '@/server/openai'
import { withRateLimit, apiRateLimit } from '@/lib/middleware/rateLimiter'
import { sanitizeInput } from '@/lib/security/encryption'

async function chatHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { transcript, memory } = req.body

  // Sanitize user input for security
  const sanitizedTranscript = sanitizeInput(transcript || '')
  
  if (!sanitizedTranscript) {
    return res.status(400).json({ error: 'Invalid or empty transcript' })
  }

  try {
    const prompt = buildMemoryAwarePrompt(memory, sanitizedTranscript)

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    })

    const reply = completion.choices[0]?.message?.content?.trim() || ''

    const updatedMemory = [...(memory || []), { user: sanitizedTranscript, assistant: reply }]

    return res.status(200).json({ reply, updatedMemory })
  } catch (error: any) {
    console.error('API Error:', error)
    return res.status(500).json({ error: error.message || 'Something went wrong.' })
  }
}

// Export the handler with rate limiting applied
export default withRateLimit(chatHandler, {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20, // 20 requests per minute per IP
  message: 'Too many chat requests. Please wait before sending more messages.'
})
