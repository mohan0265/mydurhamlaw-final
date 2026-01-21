'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Mic, Square } from 'lucide-react'
// Durmah config removed - using fallback speech detection

interface ChatInputProps {
  onSendMessage?: (message: string) => void
  onVoiceToggle?: () => void
  isListening?: boolean
  disabled?: boolean
  placeholder?: string
  input?: string
  setInput?: (value: string) => void
  onSubmit?: () => void
  isVoicePlaying?: boolean
  onInterruptVoice?: () => void
  onTranscriptUpdate?: (transcript: string, isFinal: boolean) => void
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onVoiceToggle,
  isListening = false,
  disabled = false,
  placeholder = 'Message Durmah...',
  input: externalInput,
  setInput: externalSetInput,
  onSubmit: externalOnSubmit,
  isVoicePlaying = false,
  onInterruptVoice,
  onTranscriptUpdate,
}) => {
  const [internalInput, setInternalInput] = useState('')
  const inputValue = externalInput !== undefined ? externalInput : internalInput
  const setInputValue = externalSetInput || setInternalInput
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const pauseTimerRef = useRef<NodeJS.Timeout>()
  const lastTranscriptRef = useRef('')
  const [interimTranscript, setInterimTranscript] = useState('')

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  // === ADVANCED PAUSE DETECTION & AUTO-SUBMIT ===
  
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear pause detection timer
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current)
      pauseTimerRef.current = undefined
    }
    
    if (inputValue.trim() && !disabled) {
      // Interrupt voice if playing
      if (isVoicePlaying && onInterruptVoice) {
        onInterruptVoice()
      }
      
      if (onSendMessage) {
        onSendMessage(inputValue.trim())
        if (!externalInput) setInternalInput('')
      } else if (externalOnSubmit) {
        externalOnSubmit()
      }
      
      // Clear interim transcript
      setInterimTranscript('')
      lastTranscriptRef.current = ''
      
      // Focus back to input for smooth conversation flow
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [inputValue, disabled, isVoicePlaying, onInterruptVoice, onSendMessage, externalInput, externalOnSubmit])
  
  const triggerAutoSubmit = useCallback(() => {
    if (inputValue.trim() && !disabled) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Auto-submitting after pause detection:', inputValue.slice(0, 30) + '...')
      }
      
      // Clear any pending pause timer
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current)
        pauseTimerRef.current = undefined
      }
      
      handleSubmit(new Event('submit') as any)
    }
  }, [inputValue, disabled, handleSubmit])
  
  const startPauseDetection = useCallback(() => {
    // Clear existing timer
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current)
    }
    
    // Set new pause detection timer
    pauseTimerRef.current = setTimeout(() => {
      triggerAutoSubmit()
    }, 1500) // 1.5 second fallback
  }, [triggerAutoSubmit])
  
  // Handle transcript updates (for voice input)
  const handleTranscriptChange = useCallback((newTranscript: string, isFinal: boolean) => {
    if (onTranscriptUpdate) {
      onTranscriptUpdate(newTranscript, isFinal)
    }
    
    if (isFinal) {
      // Final transcript - add to input
      if (externalInput !== undefined && externalSetInput) {
        externalSetInput(inputValue + newTranscript)
      } else {
        setInternalInput(prev => prev + newTranscript)
      }
      setInterimTranscript('')
      lastTranscriptRef.current = newTranscript
      
      // Check for immediate submission triggers (punctuation)
      // Simple speech end detection fallback
      if (newTranscript.trim().length > 3 && (newTranscript.endsWith('.') || newTranscript.endsWith('?') || newTranscript.endsWith('!'))) {
        // Small delay to allow for additional speech
        setTimeout(() => {
          if (inputValue.trim()) {
            triggerAutoSubmit()
          }
        }, 300)
      } else {
        // Start pause detection for auto-submit
        startPauseDetection()
      }
    } else {
      // Interim transcript - show as placeholder
      setInterimTranscript(newTranscript)
      startPauseDetection() // Reset pause timer on continued speech
    }
  }, [inputValue, triggerAutoSubmit, startPauseDetection, onTranscriptUpdate, externalInput, externalSetInput])

  const handleVoiceClick = () => {
    // Clear pause detection when manually toggling voice
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current)
      pauseTimerRef.current = undefined
    }
    
    if (isVoicePlaying && onInterruptVoice) {
      onInterruptVoice()
    }
    if (onVoiceToggle) {
      onVoiceToggle()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    
    // Clear interim transcript when user types manually
    if (interimTranscript) {
      setInterimTranscript('')
    }
    
    // Clear pause detection on manual typing
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current)
      pauseTimerRef.current = undefined
    }
    
    // If user starts typing while voice is playing, interrupt it
    if (isVoicePlaying && onInterruptVoice && newValue.length > inputValue.length) {
      onInterruptVoice()
    }
  }

  // Auto-focus and mobile optimization
  useEffect(() => {
    if (inputRef.current && !disabled) {
      // Small delay to ensure proper focus on mobile
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [disabled])
  
  // Cleanup pause detection on unmount
  useEffect(() => {
    return () => {
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current)
      }
    }
  }, [])

  return (
    <div className="relative w-full">
      {/* ChatGPT-style input container */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 mx-2 sm:mx-4 mb-2 sm:mb-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl shadow-lg focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent transition-all duration-200"
      >
        {/* Main text input with live transcription */}
        {/* Main text input with live transcription */}
        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              // Create synthetic event or call handler directly
              handleSubmit(e as any);
            }
          }}
          placeholder={isListening ? 'Listening...' : placeholder}
          disabled={disabled}
          className="flex-1 px-3 sm:px-4 py-3 sm:py-2 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none resize-none text-sm sm:text-base leading-relaxed disabled:opacity-50 min-h-[44px] max-h-[200px] overflow-y-auto"
          aria-label="Chat with Durmah"
          autoComplete="off"
          rows={1}
        />

        {/* Single mic icon (ChatGPT style) */}
        {onVoiceToggle && (
          <button
            type="button"
            onClick={handleVoiceClick}
            disabled={disabled}
            className={`relative p-3 sm:p-2 rounded-full transition-all duration-300 transform active:scale-95 ${
              isListening
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/30'
                : 'text-gray-400 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 dark:hover:bg-purple-900/20 active:bg-purple-100 dark:active:bg-purple-800/30'
            } disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-w-[48px] min-h-[48px] flex-shrink-0 flex items-center justify-center`}
            aria-label={isListening ? 'Stop listening' : 'Start voice input'}
          >
            <Mic className="w-5 h-5 sm:w-4 sm:h-4" />
            
            {/* Enhanced mobile-friendly pulse animation */}
            {isListening && (
              <>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-indigo-400 animate-ping opacity-30"></div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-300 to-indigo-300 animate-pulse opacity-40"></div>
                <div className="absolute inset-0 rounded-full bg-white animate-pulse opacity-20"></div>
              </>
            )}
          </button>
        )}

        {/* Send button - only show when there's text or not listening */}
        {(inputValue.trim() && !isListening) && (
          <button
            type="submit"
            disabled={disabled || isListening}
            className="p-3 sm:p-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full hover:from-purple-700 hover:to-indigo-700 active:from-purple-800 active:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/30 touch-manipulation min-w-[48px] min-h-[48px] flex-shrink-0 flex items-center justify-center"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Live transcription indicator */}
      {isListening && (
        <div className="absolute -top-2 left-4 sm:left-8 px-3 py-1 bg-purple-600 text-white text-xs font-medium rounded-full animate-pulse z-10">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
            <span>Listening...</span>
          </div>
        </div>
      )}

      {/* Voice playback indicator */}
      {isVoicePlaying && (
        <div className="absolute -top-2 right-4 sm:right-8 px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-full z-10">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="hidden sm:inline">Durmah is speaking...</span>
            <span className="sm:hidden">Speaking...</span>
          </div>
        </div>
      )}
    </div>
  )
}
