// Enhanced hook for continuous voice session management
import { useState, useCallback, useRef, useEffect } from 'react'
import { useAuth } from '@/lib/supabase/AuthContext'

interface VoiceMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface VoiceSessionOptions {
  autoStart?: boolean
  maxDuration?: number // Max session duration in minutes
  silenceTimeout?: number // Auto-pause after silence (ms)
}

export const useDurmahVoiceSession = (options: VoiceSessionOptions = {}) => {
  const { user } = useAuth()
  const {
    autoStart = false,
    maxDuration = 60, // 60 minutes max
    silenceTimeout = 5000 // 5 seconds
  } = options

  // Session State
  const [isActive, setIsActive] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState<VoiceMessage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [volume, setVolume] = useState(0)
  const [sessionDuration, setSessionDuration] = useState(0)

  // Refs for managing voice components
  const recognitionRef = useRef<any>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Check for API key availability
  const checkAPIKeys = useCallback(async () => {
    try {
      // Test TTS endpoint
      const ttsResponse = await fetch('/api/durmah/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'test' })
      })
      
      if (!ttsResponse.ok) {
        const error = await ttsResponse.json()
        if (error.error === 'missing_elevenlabs_key') {
          throw new Error('ElevenLabs API key not configured. Voice features are unavailable.')
        }
      }

      // Test ASR endpoint with empty audio (should fail gracefully)
      const asrResponse = await fetch('/api/durmah/transcribe', {
        method: 'POST',
        body: new ArrayBuffer(0)
      })
      
      if (!asrResponse.ok) {
        const error = await asrResponse.json()
        if (error.error === 'missing_openai_key') {
          throw new Error('OpenAI API key not configured. Voice transcription is unavailable.')
        }
      }
      
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }, [])

  // Initialize audio context and analyzer for volume detection
  const initializeAudioContext = useCallback(async () => {
    try {
      audioContextRef.current = new AudioContext()
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const source = audioContextRef.current.createMediaStreamSource(stream)
      
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      source.connect(analyserRef.current)
      
      return stream
    } catch (err: any) {
      console.error('Failed to initialize audio context:', err)
      setError('Microphone access denied. Please enable microphone permissions.')
      return null
    }
  }, [])

  // Volume monitoring
  const monitorVolume = useCallback(() => {
    if (!analyserRef.current) return
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)
    
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
    const normalizedVolume = Math.min(1, average / 128)
    
    setVolume(normalizedVolume)
    
    if (isListening) {
      requestAnimationFrame(monitorVolume)
    }
  }, [isListening])

  // Initialize speech recognition
  const initializeSpeechRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition not supported in this browser.')
      return false
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
    recognitionRef.current = new SpeechRecognition()
    
    recognitionRef.current.continuous = true
    recognitionRef.current.interimResults = false
    recognitionRef.current.lang = 'en-GB'
    recognitionRef.current.maxAlternatives = 1

    recognitionRef.current.onstart = () => {
      console.log('[Durmah] Speech recognition started')
      setIsListening(true)
      setError(null)
      monitorVolume()
    }

    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim()
      if (transcript) {
        console.log('[Durmah] User said:', transcript)
        handleUserInput(transcript)
      }
    }

    recognitionRef.current.onerror = (event: any) => {
      console.error('[Durmah] Speech recognition error:', event.error)
      if (event.error === 'no-speech') {
        // Restart listening after silence
        if (isActive) {
          setTimeout(() => {
            if (recognitionRef.current && isActive) {
              recognitionRef.current.start()
            }
          }, 1000)
        }
      } else {
        setError(`Speech recognition error: ${event.error}`)
      }
    }

    recognitionRef.current.onend = () => {
      console.log('[Durmah] Speech recognition ended')
      setIsListening(false)
      
      // Restart if session is still active and we're not speaking
      if (isActive && !isSpeaking && !isProcessing) {
        setTimeout(() => {
          if (recognitionRef.current && isActive) {
            recognitionRef.current.start()
          }
        }, 500)
      }
    }

    return true
  }, [isActive, isSpeaking, isProcessing, monitorVolume])

  // Handle user voice input
  const handleUserInput = useCallback(async (text: string) => {
    if (!text.trim()) return

    // Stop listening while processing
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }

    setIsProcessing(true)
    setIsListening(false)
    
    // Add user message to transcript
    const userMessage: VoiceMessage = {
      role: 'user',
      content: text,
      timestamp: Date.now()
    }
    
    setTranscript(prev => [...prev, userMessage])

    try {
      // Abort any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      
      abortControllerRef.current = new AbortController()

      // Get AI response
      const response = await fetch('/api/durmah/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...transcript.map(({ role, content }) => ({ role, content })),
            { role: 'user', content: text }
          ],
          voice: true, // Indicate voice mode for shorter responses
          pageContext: document.title
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`)
      }

      let assistantResponse = ''
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      
      if (reader) {
        let buffer = ''
        
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim()
              if (data === '[DONE]') break
              
              try {
                const parsed = JSON.parse(data)
                const delta = parsed.choices?.[0]?.delta?.content
                if (delta) {
                  assistantResponse += delta
                }
              } catch (e) {
                // Ignore malformed chunks
              }
            }
          }
        }
      }

      if (assistantResponse.trim()) {
        // Add assistant message to transcript
        const assistantMessage: VoiceMessage = {
          role: 'assistant',
          content: assistantResponse.trim(),
          timestamp: Date.now()
        }
        
        setTranscript(prev => [...prev, assistantMessage])
        
        // Convert to speech
        await speakText(assistantResponse.trim())
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('[Durmah] Error processing input:', err)
        setError('Failed to process your request. Please try again.')
      }
    } finally {
      setIsProcessing(false)
    }
  }, [transcript])

  // Convert text to speech
  const speakText = useCallback(async (text: string) => {
    try {
      setIsSpeaking(true)
      
      const response = await fetch('/api/durmah/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })

      if (!response.ok) {
        throw new Error('TTS request failed')
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      
      // Stop any current audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current = null
      }
      
      const audio = new Audio(audioUrl)
      currentAudioRef.current = audio
      
      audio.onended = () => {
        setIsSpeaking(false)
        URL.revokeObjectURL(audioUrl)
        currentAudioRef.current = null
        
        // Resume listening after speech ends
        if (isActive && recognitionRef.current) {
          setTimeout(() => {
            if (recognitionRef.current && isActive) {
              recognitionRef.current.start()
            }
          }, 500)
        }
      }
      
      audio.onerror = () => {
        setIsSpeaking(false)
        setError('Failed to play audio response')
        URL.revokeObjectURL(audioUrl)
        currentAudioRef.current = null
      }
      
      await audio.play()
    } catch (err: any) {
      console.error('[Durmah] TTS error:', err)
      setIsSpeaking(false)
      setError('Failed to generate speech. Please check your connection.')
    }
  }, [isActive])

  // Start voice session
  const startSession = useCallback(async () => {
    console.log('[Durmah] Starting voice session')
    
    if (!user) {
      setError('Please sign in to use voice features')
      return
    }

    // Check API keys first
    const keysAvailable = await checkAPIKeys()
    if (!keysAvailable) {
      return
    }

    // Initialize audio context
    const stream = await initializeAudioContext()
    if (!stream) return

    // Initialize speech recognition
    if (!initializeSpeechRecognition()) return

    setIsActive(true)
    setError(null)
    setSessionDuration(0)
    
    // Start session timer
    sessionTimerRef.current = setInterval(() => {
      setSessionDuration(prev => {
        const newDuration = prev + 1
        if (newDuration >= maxDuration * 60) {
          stopSession()
          setError(`Session ended after ${maxDuration} minutes`)
        }
        return newDuration
      })
    }, 1000)

    // Start listening
    if (recognitionRef.current) {
      recognitionRef.current.start()
    }
  }, [user, checkAPIKeys, initializeAudioContext, initializeSpeechRecognition, maxDuration])

  // Stop voice session
  const stopSession = useCallback(() => {
    console.log('[Durmah] Stopping voice session')
    
    setIsActive(false)
    setIsListening(false)
    setIsSpeaking(false)
    setIsProcessing(false)
    
    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    
    // Stop any playing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
    }
    
    // Abort any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    
    // Clear timers
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
    }
    
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current)
    }
    
    setVolume(0)
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && user && !isActive) {
      startSession()
    }
  }, [autoStart, user, isActive, startSession])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSession()
    }
  }, [stopSession])

  return {
    // State
    isActive,
    isListening,
    isSpeaking,
    isProcessing,
    transcript,
    error,
    volume,
    sessionDuration,
    
    // Actions
    startSession,
    stopSession,
    clearError,
    
    // Computed
    canStart: !!user && !isActive,
    hasTranscript: transcript.length > 0
  }
}