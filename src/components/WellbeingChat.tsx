'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ChatBubble } from './chat/ChatBubble'
import { ChatInput } from './chat/ChatInput'
import { ChatLoading } from './chat/ChatLoading'
// import { VoiceIndicator } from './chat/VoiceIndicator' // Removed - using new voice system
import { useAuth } from '@/lib/supabase/AuthContext'
import { useDurmah } from '@/lib/durmah/context'
import { Message } from '@/types/chat'
import { 
  streamGPT4oResponse, 
  interruptVoice, 
} from '@/lib/openai'
// Durmah config removed - using fallback speech detection
import { AssistanceLevel } from './wellbeing/AssistanceLevelPopover'
import { speakWithElevenLabs, stop as stopTTS, isSpeaking } from '@/lib/tts/elevenLabsClient'
import toast from 'react-hot-toast'
import { Volume2, Square } from 'lucide-react'

declare global {
  interface Window {
    webkitSpeechRecognition: any
    SpeechRecognition: any
  }
}

// Enhanced Speech Recognition interfaces
interface SpeechRecognition extends EventTarget {
  continuous: boolean
  grammars: any
  interimResults: boolean
  lang: string
  maxAlternatives: number
  serviceURI: string
  start(): void
  stop(): void
  abort(): void
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null
  onend: ((this: SpeechRecognition, ev: Event) => any) | null
  onerror: ((this: SpeechRecognition, ev: any) => any) | null
  onnomatch: ((this: SpeechRecognition, ev: any) => any) | null
  onresult: ((this: SpeechRecognition, ev: any) => any) | null
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null
}

const SILENCE_TIMEOUT = 3000 // 3 seconds of silence before stopping

interface WellbeingChatProps {
  title?: string
  description?: string
  suggestions?: string[]
  className?: string
  assistanceLevel: AssistanceLevel
  pledgedAt: string | null
  onClose?: () => void
}

export const WellbeingChat: React.FC<WellbeingChatProps> = ({
  title = "Chat with Durmah",
  description = "Your wellbeing companion is here to listen and support you.",
  suggestions = [
    "I&apos;ve been feeling overwhelmed with my studies.",
    "Help me create a better study-life balance.", 
    "I need some motivation to keep going.",
    "Can you help me reflect on my week?",
    "What are some good stress management techniques?"
  ],
  className = "",
  assistanceLevel,
  pledgedAt,
  onClose,
}) => {
  const { user, userProfile } = useAuth()
  const mdl = useDurmah()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isTTSSpeaking, setIsTTSSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Local function to handle pledge requirement
  const onPledgeRequired = () => {
    toast.error('Please acknowledge the academic integrity pledge before chatting.')
    // Could redirect to pledge page or show modal
    // For now, just show a toast notification
  }
  
  // Voice recognition setup
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout>()
  const isManualStopRef = useRef(false)
  const lastTranscriptRef = useRef('')

  // Voice control functions
  const handleVoiceStart = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        // Clear any previous transcription
        setInput('')
        lastTranscriptRef.current = ''
        isManualStopRef.current = false
        
        recognitionRef.current.start()
      } catch (error) {
        console.error('Error starting voice recognition:', error)
        setError('Failed to start voice recognition')
      }
    }
  }, [isListening])

  const handleVoiceStop = useCallback(() => {
    if (recognitionRef.current && isListening) {
      isManualStopRef.current = true
      recognitionRef.current.stop()
      
      // Clear silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = undefined
      }
    }
  }, [isListening])

  // Initialize speech recognition with enhanced settings
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        const recognition = recognitionRef.current
        
        if (recognition) {
          // Enhanced configuration for longer recording
          recognition.continuous = true  // Keep listening continuously
          recognition.interimResults = true  // Show live transcription
          recognition.lang = 'en-US'
          recognition.maxAlternatives = 1
        
        recognition.onstart = () => {
          console.log('🎤 Voice recognition started')
          setIsListening(true)
          setError(null)
          isManualStopRef.current = false
        }

        recognition.onresult = (event) => {
          let interimTranscript = ''
          let finalTranscript = ''

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript
            } else {
              interimTranscript += transcript
            }
          }

          if (finalTranscript) {
            console.log('🎯 Final transcript:', finalTranscript)
            setInput(prev => prev + finalTranscript)
            lastTranscriptRef.current = finalTranscript
            
            // Reset silence timer when we get speech
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current)
            }
            
            // Check if this looks like a complete thought
            // Simple speech end detection fallback
            if (finalTranscript.trim().length > 3 && (finalTranscript.endsWith('.') || finalTranscript.endsWith('?') || finalTranscript.endsWith('!'))) {
              console.log('🏁 Detected speech end, stopping after delay')
              // Give a moment for any additional speech
              silenceTimerRef.current = setTimeout(() => {
                if (!isManualStopRef.current) {
                  handleVoiceStop()
                }
              }, 1500)
            } else {
              // Start silence detection timer
              silenceTimerRef.current = setTimeout(() => {
                if (!isManualStopRef.current) {
                  console.log('🔇 Silence detected, processing')
                  handleVoiceStop()
                }
              }, SILENCE_TIMEOUT)
            }
          } else if (interimTranscript) {
            // Show interim results but don't reset timer
            console.log('📝 Interim:', interimTranscript)
          }
        }

        recognition.onerror = (event) => {
          console.error('🚨 Speech recognition error:', event.error)
          setError(`Voice recognition error: ${event.error}`)
          setIsListening(false)
          
          // Clear any timers
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current)
          }
        }

        recognition.onend = () => {
          console.log('🎤 Voice recognition ended')
          setIsListening(false)
          
          // Clear any timers
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current)
          }
        }

        recognition.onspeechstart = () => {
          console.log('🗣️ Speech detected')
        }

        recognition.onspeechend = () => {
          console.log('🤐 Speech ended')
        }

        recognition.onsoundstart = () => {
          console.log('🔊 Sound detected')
        }

        recognition.onsoundend = () => {
          console.log('🔇 Sound ended')
        }
        }
      }
    }

    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
      }
    }
  }, [handleVoiceStop])

  const handleVoiceToggle = useCallback(() => {
    if (isListening) {
      handleVoiceStop()
    } else {
      handleVoiceStart()
    }
  }, [isListening, handleVoiceStart, handleVoiceStop])

  // Voice interruption
  const handleInterruptVoice = useCallback(() => {
    if (isTTSSpeaking) {
      stopTTS()
      setIsTTSSpeaking(false)
    }
  }, [isTTSSpeaking])

  // Enhanced message sending with validation
  const handleSendMessage = useCallback(async (messageText: string) => {
    const trimmedMessage = messageText.trim()
    
    // Validate message content
    if (!trimmedMessage) {
      console.warn('Empty message, not sending')
      return
    }

    if (!user?.id) {
      setError('Please log in to chat')
      return
    }

    if (!pledgedAt) {
      onPledgeRequired()
      return
    }

    console.log('📤 Sending message:', trimmedMessage)

    // Stop any voice input
    if (isListening) {
      handleVoiceStop()
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmedMessage,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      const response = await streamGPT4oResponse(
        [...messages, userMessage], 
        user.id, 
        'wellbeing',
        {
          assistanceLevel,
          pledgedAt,
        }
      )
      
      let fullText = '';
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant', 
        content: '',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, assistantMessage]);

      for await (const chunk of response.streamChunks) {
        fullText += chunk;
        setMessages(prev => prev.map(m => m.id === assistantMessage.id ? { ...m, content: fullText } : m));
      }

      if (fullText) {
        try {
          setIsTTSSpeaking(true);
          await speakWithElevenLabs(fullText, { voiceId: userProfile?.voice_id });
        } catch (e) {
          toast.error("Couldn't play voice reply.");
          console.error(e);
        } finally {
          setIsTTSSpeaking(false);
        }
      }

    } catch (error: any) {
      console.error('💥 Chat error:', error)
      
      let errorMessage = 'Sorry, something went wrong. Want to try again?'
      
      if (error.message.includes('400')) {
        errorMessage = 'There was an issue with your message. Please try rephrasing.'
      } else if (error.message.includes('401')) {
        errorMessage = 'Authentication error. Please refresh the page.'
      } else if (error.message.includes('429')) {
        errorMessage = 'Too many requests. Please wait a moment and try again.'
      }
      
      setError(errorMessage)
      
      // Add error message to chat
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ ${errorMessage}`,
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMsg])
      
    } finally {
      setIsLoading(false)
    }
  }, [messages, user, userProfile, isListening, handleVoiceStop, assistanceLevel, pledgedAt])

  // Handle suggestion clicks
  const handleSuggestionClick = useCallback((suggestion: string) => {
    setInput(suggestion)
  }, [])

  return (
    <div className={`flex flex-col h-full bg-white rounded-xl shadow-lg border overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-gradient-to-r from-purple-50 to-indigo-50 p-4 sm:p-6 rounded-t-xl">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-base sm:text-lg flex-shrink-0">
                🤖
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 leading-tight">{title}</h3>
            </div>
            <div className="flex items-center gap-2">
              {isTTSSpeaking ? (
                  <button onClick={handleInterruptVoice} className="p-2 rounded-full bg-red-500 text-white"><Square size={16} /></button>
              ) : (
                  <button className="p-2 rounded-full bg-blue-500 text-white"><Volume2 size={16} /></button>
              )}
              {onClose && (
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="rounded-md px-2 py-1 hover:bg-gray-100"
                >
                  ✕
                </button>
              )}
            </div>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
        
        {/* Voice Status */}
        {(isListening) && (
          <div className="mt-3">
            {/* VoiceIndicator component removed - using new voice system */}
            <div className="text-sm text-blue-600">Voice mode active...</div>
          </div>
        )}
        
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm leading-relaxed">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="text-red-600 text-xs underline mt-2 min-h-[44px] px-2 py-1 -mx-2 -my-1 rounded touch-manipulation"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 min-h-0 overscroll-contain">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-6 sm:py-8 px-2">
            <p className="mb-3 sm:mb-4 text-sm sm:text-base leading-relaxed">👋 Hi! I&apos;m Durmah, your wellbeing companion.</p>
            <p className="text-xs sm:text-sm leading-relaxed">Choose a suggestion below or share what&apos;s on your mind.</p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatBubble
              key={message.id}
              role={message.role}
              content={message.content}
              className="max-w-[90%] sm:max-w-[85%]"
            />
          ))
        )}
        
        {isLoading && (
          <ChatLoading message="Durmah is thinking..." />
        )}
      </div>

      {/* Suggestions */}
      {messages.length === 0 && suggestions.length > 0 && (
        <div className="flex-shrink-0 p-3 sm:p-4 border-t bg-gray-50">
          <p className="text-sm font-medium text-gray-700 mb-3">Suggestions:</p>
          <div className="grid grid-cols-1 gap-2 sm:gap-3">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-left p-3 sm:p-4 text-sm bg-white rounded-lg border hover:border-purple-300 hover:bg-purple-50 active:bg-purple-100 transition-colors duration-200 min-h-[48px] touch-manipulation"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 border-t p-2 sm:p-4">
        <ChatInput
          input={input}
          setInput={setInput}
          onSubmit={() => input.trim() && handleSendMessage(input)}
          onVoiceToggle={handleVoiceToggle}
          onInterruptVoice={handleInterruptVoice}
          disabled={isLoading || !pledgedAt}
          isListening={isListening}
          isVoicePlaying={isTTSSpeaking}
          placeholder={!pledgedAt ? "Please acknowledge the integrity pledge first." : `Hi ${mdl.firstName}, how can I help?`}
        />
        <div className="text-center mt-2">
            <Link href="/legal/academic-integrity" legacyBehavior>
                <a className="text-xs text-gray-500 hover:text-blue-600 transition-colors">
                    Academic Integrity First
                </a>
            </Link>
        </div>
      </div>
    </div>
  )
}

export default WellbeingChat
