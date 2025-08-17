'use client'

import { useState } from 'react'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export default function AIResearchAssistant() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const newMessages: Message[] = [...messages, { role: 'user', content: input }]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      })

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`)
      }

      const data = await response.json()
      const assistantReply: Message = {
        role: 'assistant',
        content: data.response || 'Sorry, I couldn’t find a useful answer.'
      }

      setMessages([...newMessages, assistantReply])
    } catch (err) {
      setMessages([...newMessages, {
        role: 'assistant',
        content: `Error: ${(err as Error).message}`
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 space-y-4">
      <h2 className="text-xl font-bold text-indigo-700">🎓 AI Research Assistant</h2>
      <p className="text-sm text-gray-600">
        Ask any legal question or request a summary of a case, statute, or article. The assistant will respond with a concise explanation or resource guidance.
      </p>

      <div className="border p-4 rounded-md h-[300px] overflow-y-auto bg-gray-50 text-sm space-y-3">
        {messages.length === 0 && (
          <p className="text-gray-400">Ask me anything related to UK law or your modules...</p>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`px-3 py-2 rounded-md max-w-xs ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="text-gray-500">Thinking...</div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
          className="flex-1 border px-3 py-2 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Type your legal query here..."
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  )
}
