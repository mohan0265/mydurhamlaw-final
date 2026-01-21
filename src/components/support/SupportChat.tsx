import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AuthContext } from '@/lib/supabase/AuthContext'
import toast from 'react-hot-toast'

type Message = { id?: string; role: string; content: string; created_at?: string }

type Props = {
  initialCategory?: string
  compact?: boolean
}

const CATEGORIES = [
  'Login',
  'Billing',
  'Voice/Mic',
  'Timetable/YAAG',
  'Study tools',
  'Other'
]

export function SupportChat({ initialCategory = 'Other', compact = false }: Props) {
  const { user } = React.useContext(AuthContext)
  const [visitorName, setVisitorName] = useState('')
  const [visitorEmail, setVisitorEmail] = useState('')
  const [visitorToken, setVisitorToken] = useState<string | null>(null)
  const [ticketId, setTicketId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [category, setCategory] = useState(initialCategory)
  const [loading, setLoading] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [speechAvailable, setSpeechAvailable] = useState(false)
  const [reading, setReading] = useState(false)
  const honeypotRef = useRef<HTMLInputElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null
    const rec = typeof window !== 'undefined' ? (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition : null
    setSpeechAvailable(Boolean(synth && rec))
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const appendMessage = (msg: Message) => setMessages((prev) => [...prev, msg])

  const readAloud = (text: string) => {
    if (!voiceEnabled || !speechAvailable || typeof window === 'undefined') return
    const synth = window.speechSynthesis
    if (!synth) return
    const utter = new SpeechSynthesisUtterance(text)
    setReading(true)
    utter.onend = () => setReading(false)
    synth.speak(utter)
  }

  const fetchThread = async (ticket_id: string, visitor_token?: string | null) => {
    setLoading(true)
    try {
      const res = await fetch('/.netlify/functions/support-get-thread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id,
          visitor_token,
          user_id: user?.id || null
        })
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'Failed')
      setMessages(json.messages || [])
      setTicketId(json.ticket?.id || ticket_id)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load thread')
    } finally {
      setLoading(false)
    }
  }

  const ensureTicket = async () => {
    if (ticketId) return ticketId
    setLoading(true)
    try {
      const res = await fetch('/.netlify/functions/support-create-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `[${category}] ${input.slice(0, 60) || 'Help needed'}`,
          message: input || 'Help needed',
          visitor_name: visitorName,
          visitor_email: visitorEmail,
          user_id: user?.id || null,
          display_name: user?.user_metadata?.full_name || visitorName,
          page_url: typeof window !== 'undefined' ? window.location.href : '',
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          _hp: honeypotRef.current?.value || ''
        })
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'Failed to create ticket')
      if (json.visitor_token) setVisitorToken(json.visitor_token)
      setTicketId(json.ticket_id)
      appendMessage({ role: 'user', content: input })
      setInput('')
      return json.ticket_id as string
    } catch (err: any) {
      toast.error(err?.message || 'Could not create ticket')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim()) return
    if (!user && (!visitorName || !visitorEmail)) {
      toast.error('Please provide name and email')
      return
    }
    const tid = ticketId || (await ensureTicket())
    setLoading(true)
    try {
      const res = await fetch('/.netlify/functions/support-post-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: tid,
          message: input,
          visitor_token: visitorToken,
          user_id: user?.id || null,
          _hp: honeypotRef.current?.value || ''
        })
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'Failed to send')
      setMessages(json.messages || [])
      if (json.ai) readAloud(json.ai)
      setInput('')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send')
    } finally {
      setLoading(false)
    }
  }

  const startVoice = () => {
    if (!speechAvailable) return
    const Rec = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const rec = new Rec()
    rec.lang = 'en-US'
    rec.onresult = (e: any) => {
      const transcript = e.results?.[0]?.[0]?.transcript || ''
      setInput((prev) => prev + ' ' + transcript)
    }
    rec.start()
  }

  const sendOnEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const chatClasses = compact ? 'text-sm' : ''

  return (
    <div className="flex flex-col gap-3">
      {!user && (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <input
            placeholder="Your name"
            value={visitorName}
            onChange={(e) => setVisitorName(e.target.value)}
            className="border rounded-lg px-3 py-2"
          />
          <input
            placeholder="Your email"
            value={visitorEmail}
            onChange={(e) => setVisitorEmail(e.target.value)}
            className="border rounded-lg px-3 py-2"
          />
          <input ref={honeypotRef} className="hidden" tabIndex={-1} autoComplete="off" />
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-xs">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1 rounded-full border ${category === cat ? 'bg-purple-600 text-white border-purple-600' : 'border-slate-200 text-slate-700'}`}
          >
            {cat}
          </button>
        ))}
        {speechAvailable && (
          <label className="flex items-center gap-1 text-slate-600">
            <input type="checkbox" checked={voiceEnabled} onChange={(e) => setVoiceEnabled(e.target.checked)} />
            Voice beta
          </label>
        )}
      </div>

      <div className={`border rounded-xl bg-white p-3 h-80 overflow-auto ${chatClasses}`}>
        {messages.length === 0 && <p className="text-slate-400 text-sm">Start a conversation and we’ll help.</p>}
        {messages.map((m) => (
          <div key={m.id || Math.random()} className="mb-2">
            <div className="text-xs font-semibold text-slate-500 mb-0.5">
              {m.role === 'assistant' ? 'Support' : m.role === 'admin' ? 'Admin' : 'You'}
            </div>
            <div className={`rounded-lg px-3 py-2 ${m.role === 'assistant' ? 'bg-purple-50' : 'bg-slate-50'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-xs text-slate-500">Sending…</div>}
      </div>

      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Describe the issue…"
          className="flex-1 border rounded-lg px-3 py-2 resize-none min-h-[38px] max-h-[200px] overflow-y-auto"
        />
        {voiceEnabled && speechAvailable && (
          <button onClick={startVoice} className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600">
            🎤
          </button>
        )}
        <button
          onClick={sendMessage}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 disabled:opacity-60 h-[38px] flex items-center justify-center"
        >
          Send
        </button>
      </div>

      {voiceEnabled && speechAvailable && (
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <input type="checkbox" checked={reading} onChange={(e) => setReading(e.target.checked)} />
          Read replies aloud (beta)
        </label>
      )}
    </div>
  )
}
