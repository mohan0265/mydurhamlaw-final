// CLIENT SIDE ONLY - Safe for frontend components
// No OpenAI imports or API keys here

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

// Client-side helper for streaming GPT-4o responses
export async function streamChatCompletion(messages: ChatMessage[], endpoint: string) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  if (!response.body) {
    throw new Error('No response body received')
  }

  return response.body.getReader()
}

// Helper to read streaming response
export async function* readStreamingResponse(reader: ReadableStreamDefaultReader<Uint8Array>) {
  const decoder = new TextDecoder()
  
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      const chunk = decoder.decode(value, { stream: true })
      yield chunk
    }
  } finally {
    reader.releaseLock()
  }
}

// Convenience function for complete streaming flow
export async function streamAndCollectResponse(messages: ChatMessage[], endpoint: string) {
  const reader = await streamChatCompletion(messages, endpoint)
  let fullResponse = ''
  
  for await (const chunk of readStreamingResponse(reader)) {
    fullResponse += chunk
  }
  
  return fullResponse
}