// src/lib/server/openai.ts - Server-only OpenAI utilities
import { openai, validateOpenAIKey } from '@/server/openai'

export async function streamGPT4oResponse(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>) {
  // Validate messages array
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    throw new Error('Invalid messages: must be a non-empty array')
  }

  // Validate each message
  for (const message of messages) {
    if (!message.content || typeof message.content !== 'string' || message.content.trim().length === 0) {
      throw new Error('Invalid message: content must be a non-empty string')
    }
    if (!['system', 'user', 'assistant'].includes(message.role)) {
      throw new Error('Invalid message: role must be system, user, or assistant')
    }
  }

  // Ensure we have proper API key
  validateOpenAIKey()

  console.log('🚀 Starting GPT-4o completion with', messages.length, 'messages')

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: messages,
    stream: true,
    temperature: 0.7,
    max_tokens: 2000,
  })

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let hasContent = false
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || ''
          if (content) {
            hasContent = true
            controller.enqueue(new TextEncoder().encode(content))
          }
        }
        
        if (!hasContent) {
          console.warn('⚠️ No content received from OpenAI')
          controller.enqueue(new TextEncoder().encode('I apologize, but I cannot provide a response right now. Please try again.'))
        }
        
        console.log('✅ GPT-4o completion finished successfully')
        controller.close()
      } catch (error: any) {
        console.error('❌ Streaming error:', error)
        
        // Provide helpful error message based on error type
        let errorMessage = 'Sorry, something went wrong. Please try again.'
        if (error.status === 400) {
          errorMessage = 'Invalid request. Please try rephrasing your message.'
        } else if (error.status === 401) {
          errorMessage = 'Authentication error. Please refresh the page.'
        } else if (error.status === 429) {
          errorMessage = 'Too many requests. Please wait a moment and try again.'
        } else if (error.status >= 500) {
          errorMessage = 'Server error. Please try again in a moment.'
        }
        
        controller.enqueue(new TextEncoder().encode(errorMessage))
        controller.close()
      }
    },
  })

  return stream
}