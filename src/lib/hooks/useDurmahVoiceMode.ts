// Enhanced hook specifically for the new ChatGPT-style voice mode
import { useCallback, useRef, useEffect } from 'react'
import { useDurmahSpeech } from './useDurmahSpeech'
import { useDurmah } from '@/context/DurmahContext'
import { ttsController } from '@/lib/voice/ttsController';

const SILENCE_DETECTION_TIMEOUT = 3000 // 3 seconds

interface UseDurmahVoiceModeOptions {
  onTranscriptReady?: (transcript: string) => void
  onError?: (error: string) => void
  onVolumeChange?: (volume: number) => void; // Added onVolumeChange
}

export const useDurmahVoiceMode = (options: UseDurmahVoiceModeOptions = {}) => {
  const {
    state,
    setState,
    pushMessage,
    displayMessages,
    startListening,
    stopListening,
    startSpeaking,
    stopSpeaking,
    setProcessing,
    setInterim,
    openTranscript,
  } = useDurmah()

  const silenceTimerRef = useRef<NodeJS.Timeout>()
  const streamControllerRef = useRef<AbortController>()
  const currentTranscriptRef = useRef('')

  // Stream assistant reply with proper sentence merging
  const processVoiceInput = useCallback(async (userText: string) => {
    if (!userText.trim()) return

    try {
      ttsController.stopAll();
      
      if (streamControllerRef.current) {
        streamControllerRef.current.abort()
      }
      
      setProcessing(true)
      pushMessage({ role: 'user', content: userText })
      
      streamControllerRef.current = new AbortController()
      
      const res = await fetch('/api/durmah/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...displayMessages.map(({ role, content }) => ({ role, content })),
            { role: 'user', content: userText },
          ],
          pageContext: typeof window !== 'undefined' ? document.title : undefined,
          voice: true, // Indicate voice mode for shorter responses
        }),
        signal: streamControllerRef.current.signal,
      })
      
      if (!res.ok || !res.body) {
        throw new Error(`Stream request failed: ${res.status}`)
      }
      
      setProcessing(false)
      startSpeaking()
      
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let assembled = ''
      
      const processChunk = (line: string) => {
        if (!line.startsWith('data:')) return
        const json = line.slice(5).trim()
        if (json === '[DONE]') return
        
        try {
          const obj = JSON.parse(json)
          const delta = obj.choices?.[0]?.delta?.content ?? ''
          if (delta) {
            assembled += delta
            pushMessage({ role: 'assistant', content: delta })
          }
        } catch (e) {
          console.debug('[Durmah Voice Mode] Ignoring malformed chunk:', json)
        }
      }
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        
        for (const line of lines) {
          processChunk(line)
        }
      }
      
      stopSpeaking()
      
      // Clean up the assembled text and speak it
      if (assembled.trim()) {
        const cleanText = assembled
          .replace(/\s+([,!.?;:])/g, '$1')
          .trim()
        
        await ttsController.speakSentences(cleanText)
      }
      
    } catch (error: any) {
      console.error('[Durmah Voice Mode] Stream error:', error)
      
      setProcessing(false)
      stopSpeaking()
      
      if (error.name === 'AbortError') {
        console.log('[Durmah Voice Mode] Stream was cancelled')
        return
      }
      
      const errorMessage = error.message || 'Something went wrong. Please try again.'
      options.onError?.(errorMessage)
      
      pushMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an issue. Please try again.'
      })
    } finally {
      streamControllerRef.current = undefined
    }
  }, [displayMessages, pushMessage, startSpeaking, stopSpeaking, setProcessing, options])

  // Speech recognition setup
  const speechRecognition = useDurmahSpeech({
    onStart: () => {
      console.log('barge_in');
      ttsController.stopAll();
      console.log('[Durmah Voice Mode] Speech recognition started')
      setState('listening')
      currentTranscriptRef.current = ''
    },
    
    onInterim: (text) => {
      currentTranscriptRef.current = text
      setInterim(text)
    },
    
    onFinal: (text) => {
      if (!text.trim()) return
      
      console.log('[Durmah Voice Mode] Final transcript:', text)
      setInterim('')
      currentTranscriptRef.current = ''
      
      // Clear any pending silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = undefined
      }
      
      // Process the final transcript
      processVoiceInput(text)
      options.onTranscriptReady?.(text)
    },
    
    onEnd: () => {
      console.log('[Durmah Voice Mode] Speech recognition ended')
      setState('idle')
      setInterim('')
    },
    
    onError: (errorType) => {
      console.warn('[Durmah Voice Mode] Speech error:', errorType)
      setState('idle')
      setInterim('')
      
      const errorMessages: Record<string, string> = {
        'not_supported': 'Speech recognition is not supported in this browser.',
        'not-allowed': 'Microphone access was denied. Please allow microphone access.',
        'network': 'Network error. Please check your connection.',
        'start_failed': 'Failed to start speech recognition. Please try again.',
      }
      
      const errorMessage = errorMessages[errorType] || `Speech error: ${errorType}`
      options.onError?.(errorMessage)
    },
    onVolumeChange: options.onVolumeChange, // Pass through onVolumeChange
  })

  // Start voice conversation
  const startVoiceConversation = useCallback(() => {
    console.log('[Durmah Voice Mode] Starting voice conversation')
    
    if (!speechRecognition.isSupported) {
      options.onError?.('Speech recognition is not supported in this browser. Please use Chrome or Edge.')
      return false
    }
    
    const success = speechRecognition.start()
    if (success) {
      startListening()
    }
    return success
  }, [speechRecognition, startListening, options])

  // Stop voice conversation and show transcript
  const stopVoiceConversation = useCallback(() => {
    console.log('end_chat');
    console.log('[Durmah Voice Mode] Stopping voice conversation')
    
    // Cancel any ongoing streams
    if (streamControllerRef.current) {
      streamControllerRef.current.abort()
    }
    
    // Clear timers
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = undefined
    }
    
    // Stop speech recognition
    speechRecognition.cleanup()
    
    // Stop audio
    ttsController.stopAll();
    
    // Reset state
    stopListening()
    setInterim('')
    setProcessing(false)
    
    // Show transcript if there are messages
    if (displayMessages.length > 0) {
      setTimeout(() => {
        openTranscript()
      }, 500) // Small delay to ensure voice mode closes first
    }
  }, [speechRecognition, stopListening, setInterim, setProcessing, displayMessages, openTranscript])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      speechRecognition.cleanup()
      if (streamControllerRef.current) {
        streamControllerRef.current.abort()
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
      }
      ttsController.stopAll();
    }
  }, [speechRecognition])

  return {
    // State
    isListening: state === 'listening',
    isSpeaking: ttsController.isSpeaking(),
    isProcessing: state === 'conversation',
    currentTranscript: currentTranscriptRef.current,
    
    // Controls
    startVoiceConversation,
    stopVoiceConversation,
    
    // Speech recognition info
    isSupported: speechRecognition.isSupported,
    isRunning: speechRecognition.isRunning, // Added isRunning
  }
}