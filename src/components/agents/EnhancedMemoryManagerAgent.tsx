'use client'

import React, { useEffect, useState, useRef, useContext, useCallback } from 'react'
import { useRouter } from 'next/router'
import { getSupabaseClient } from '@/lib/supabase/client'
import { AuthContext } from '@/lib/supabase/AuthContext'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Textarea } from '../ui/Textarea'
import { Card, CardHeader, CardContent, CardTitle } from '../ui/Card'
import { Sparkles, CalendarDays, Mic, MicOff, ArrowLeft, MessageSquare, X, Volume2, AlertCircle } from 'lucide-react'
// import { useVoiceRecognition } from '@/hooks/useVoiceRecognition' // Removed - using new voice system
import { streamChatCompletion, readStreamingResponse, type ChatMessage } from '@/lib/client/apiClient'
import { VoiceMessage } from '@/types/chat'

type MemoryLog = {
  id: number
  user_id: string
  note: string
  mood: string
  created_at: string
}

const moodOptions = ['😊', '😐', '😢', '😤', '😴']

const EnhancedMemoryManagerAgent: React.FC = () => {
  const router = useRouter()
  const { getDashboardRoute } = useContext(AuthContext)
  const [note, setNote] = useState('')
  const [memories, setMemories] = useState<MemoryLog[]>([])
  const [mood, setMood] = useState('😐')
  const [loading, setLoading] = useState(false)
  
  // Voice features state
  const [isVoiceMode, setIsVoiceMode] = useState(false)
  const [voiceMessages, setVoiceMessages] = useState<VoiceMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m your AI reflection buddy. I\'m here to help you process your thoughts and experiences. What\'s been on your mind lately? How has your week been going?',
      timestamp: new Date(),
      isVoice: false
    }
  ])
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Voice recognition hook
  const {
    isListening: hookIsListening,
    transcript: hookTranscript,
    finalTranscript,
    confidence,
    error: voiceError,
    isSupported: isVoiceSupported,
    hasPermission,
    startListening,
    stopListening,
    resetTranscript,
    requestPermission
  } = {} as any // useVoiceRecognition() // Removed - using new voice system

  const fetchMemories = useCallback(async () => {
    setLoading(true)
    
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.warn('Supabase client not available');
      setLoading(false);
      return;
    }
    
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data, error } = await supabase
        .from('memory_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching memories:', error)
      } else {
        setMemories(data || [])
      }
    }
    setLoading(false)
  }, [])

  const handleSubmit = async () => {
    if (!note.trim()) return

    setLoading(true)
    
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.warn('Supabase client not available');
      setLoading(false);
      return;
    }
    
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('User not found, aborting submission.')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('wellbeing_entries').insert([
      {
        user_id: user.id,
        note,
        mood,
        created_at: new Date().toISOString(),
      },
    ])

    if (insertError) {
      console.error('Error saving memory:', insertError)
    } else {
      setNote('')
      setMood('😐')
      await fetchMemories()
    }
    setLoading(false)
  }

  const handleVoiceInput = async () => {
    if (!isVoiceSupported) {
      setError('Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.')
      return
    }

    if (hasPermission === false) {
      const granted = await requestPermission()
      if (!granted) {
        setError('Microphone access is required for voice input.')
        return
      }
    }

    if (isListening) {
      stopListening()
      if (transcript.trim()) {
        setNote(transcript)
      }
    } else {
      setError(null)
      resetTranscript()
      await startListening()
    }
  }

  // Auto-scroll to bottom of voice chat
  useEffect(() => {
    if (isVoiceMode) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [voiceMessages, isVoiceMode])

  const handleStartVoiceChat = useCallback(async () => {
    if (!isVoiceSupported) {
      setError('Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.')
      return
    }

    if (hasPermission === false) {
      const granted = await requestPermission()
      if (!granted) {
        setError('Microphone access is required for voice mode.')
        return
      }
    }

    setError(null)
    const success = await startListening()
    if (!success) {
      setError('Failed to start voice recognition')
    }
  }, [isVoiceSupported, hasPermission, requestPermission, startListening])

  // Voice chat functionality
  const handleVoiceMessage = useCallback(async (content: string) => {
    if (!content.trim() || isProcessing) return

    const userMessage: VoiceMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      isVoice: true
    }

    const newMessages = [...voiceMessages, userMessage]
    setVoiceMessages(newMessages)
    setIsProcessing(true)
    setIsStreaming(true)
    setError(null)

    try {
      // Convert to API format with reflection-specific system prompt
      const reflectionMessages: ChatMessage[] = [
        {
          role: 'system',
          content: `You are a supportive AI reflection buddy for law students at Durham University. Your role is to:
          
- Help students process their thoughts and experiences
- Ask thoughtful, gentle questions to encourage self-reflection
- Provide emotional support and encouragement
- Help identify patterns in their learning and growth
- Suggest healthy ways to cope with academic stress
- Be warm, empathetic, and non-judgmental
- Keep responses conversational and supportive

Focus on helping the student reflect on their week, their challenges, successes, and personal growth. Ask follow-up questions that encourage deeper thinking.`
        },
        ...newMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ]

      const reader = await streamChatCompletion(reflectionMessages, '/api/wellbeing-coach')
      let assistantMessage = ''
      
      // Add initial empty assistant message for streaming
      const streamMessage: VoiceMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isVoice: true
      }
      setVoiceMessages(prev => [...prev, streamMessage])

      // Stream the response
      for await (const chunk of readStreamingResponse(reader)) {
        assistantMessage += chunk
        setVoiceMessages(prev => {
          const updated = [...prev]
          const lastMessage = updated[updated.length - 1]
          if (lastMessage) {
            updated[updated.length - 1] = {
              id: lastMessage.id,
              role: 'assistant',
              content: assistantMessage,
              timestamp: lastMessage.timestamp,
              isVoice: lastMessage.isVoice
            }
          }
          return updated
        })
      }

      // Speak the response
      if (assistantMessage && window.speechSynthesis) {
        speakText(assistantMessage)
      }

    } catch (err: any) {
      console.error('Voice chat error:', err)
      setError(
        err.message === 'Failed to fetch' 
          ? 'Network error. Please check your connection and try again.'
          : 'Something went wrong. Please try asking your question again.'
      )
      
      // Remove the user message if there was an error
      setVoiceMessages(voiceMessages)
    } finally {
      setIsProcessing(false)
      setIsStreaming(false)
      // Restart listening for continuous conversation
      setTimeout(() => {
        if (isVoiceMode && !isProcessing) {
          handleStartVoiceChat()
        }
      }, 1000)
    }
  }, [voiceMessages, isProcessing, isVoiceMode, handleStartVoiceChat])

  // Handle voice recognition results
    useEffect(() => {
    if (finalTranscript && finalTranscript.trim() && !isProcessing && isVoiceMode) {
      handleVoiceMessage(finalTranscript.trim())
      resetTranscript()
    }
  }, [finalTranscript, isProcessing, isVoiceMode, resetTranscript, handleVoiceMessage])

  const speakText = (text: string) => {
    if (!window.speechSynthesis) return

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.volume = 0.8

    // Use a pleasant voice if available
    const voices = window.speechSynthesis.getVoices()
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Microsoft') ||
      voice.lang.startsWith('en')
    )
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    synthRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }

  const handleStopVoiceChat = () => {
    stopListening()
    setIsListening(false)
  }

  const handleCloseVoiceMode = () => {
    handleStopVoiceChat()
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setIsVoiceMode(false)
  }

  useEffect(() => {
    fetchMemories()
  }, [fetchMemories])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              const dashRoute = getDashboardRoute ? getDashboardRoute() : '/dashboard';
              router.push(dashRoute);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-200 text-gray-600 hover:text-blue-600"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </button>

          <Card gradient className="flex-1">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Reflect & Grow</h1>
                  <p className="text-gray-600">Your personal reflection space with AI guidance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Reflection Input */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Weekly Reflection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  What challenged or inspired you this week? Write freely and choose a mood to capture your week.
                </p>

                <div className="relative">
                  <Textarea
                    placeholder="This week I discovered that..."
                    rows={4}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="pr-12"
                  />
                  
                  {/* Microphone Icon for Text Input */}
                  {isVoiceSupported && (
                    <button
                      onClick={handleVoiceInput}
                      disabled={loading}
                      className={`absolute bottom-3 right-3 p-2 rounded-full transition-colors ${
                        isListening 
                          ? 'bg-red-500 text-white animate-pulse' 
                          : 'bg-gray-200 text-gray-600 hover:bg-blue-500 hover:text-white'
                      }`}
                      title={isListening ? 'Stop recording' : 'Start voice input'}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                {/* Live Transcript Display */}
                {transcript && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Mic className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Live Transcript:</span>
                    </div>
                    <p className="text-sm text-blue-700 italic">&quot;{transcript}&quot;</p>
                  </div>
                )}

                <div className="flex gap-2 items-center">
                  <span className="text-sm text-gray-600">Mood:</span>
                  {moodOptions.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setMood(emoji)}
                      className={`text-2xl px-2 py-1 rounded transition-all ${
                        mood === emoji ? 'ring-2 ring-purple-400 bg-purple-50' : 'hover:bg-gray-100'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleSubmit} disabled={!note.trim() || loading}>
                    {loading ? 'Saving...' : 'Save Reflection'}
                  </Button>
                  
                  {/* Voice Mode Button */}
                  <Button
                    onClick={() => setIsVoiceMode(true)}
                    variant="secondary"
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    🎙️ Voice Mode
                  </Button>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Error:</strong> {error}
                      <button 
                        onClick={() => setError(null)}
                        className="ml-2 text-red-600 hover:text-red-800 underline"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Recent Memories */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-blue-600" />
                  Recent Memory Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-gray-600">Loading memories...</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {memories.map((m) => (
                      <div
                        key={m.id}
                        className="border border-gray-200 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <p className="text-base mb-2">{m.note}</p>
                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <span>Mood:</span>
                            <span className="text-lg">{m.mood}</span>
                          </span>
                          <span>{new Date(m.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                    {memories.length === 0 && (
                      <p className="text-center text-gray-500 py-8">
                        No reflections yet. Start by adding your first reflection above!
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Voice Mode Side Panel */}
      {isVoiceMode && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
            {/* Voice Panel Header */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold">AI Reflection Buddy</h3>
                  <p className="text-sm opacity-90">
                    {isListening ? 'Listening...' : isProcessing ? 'Thinking...' : 'Ready to chat'}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleCloseVoiceMode}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 rounded-full p-2"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Voice Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {voiceMessages.map((msg) => (
                <div key={msg.id} className="space-y-2">
                  <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-lg ${
                      msg.role === 'user' 
                        ? 'bg-purple-500 text-white rounded-br-sm' 
                        : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                    }`}>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                  {msg.isVoice && msg.role === 'user' && (
                    <div className="flex justify-end">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Volume2 className="w-3 h-3" />
                        <span>Voice message</span>
                        {confidence > 0 && (
                          <span>• {Math.round(confidence * 100)}% confidence</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {isStreaming && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-800 rounded-lg rounded-bl-sm p-3 max-w-[85%] shadow-sm">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs text-gray-500">AI is reflecting...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Live Transcript in Voice Mode */}
            {transcript && isVoiceMode && (
              <div className="px-4 py-3 bg-blue-50 border-t border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <Mic className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Live Transcript:</span>
                </div>
                <p className="text-sm text-blue-700 italic">&quot;{transcript}&quot;</p>
              </div>
            )}

            {/* Voice Controls */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex items-center justify-center gap-4">
                <Button
                  onClick={isListening ? handleStopVoiceChat : handleStartVoiceChat}
                  variant={isListening ? "secondary" : "primary"}
                  size="lg"
                  className={`rounded-full w-14 h-14 ${
                    isListening 
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                      : 'bg-purple-500 hover:bg-purple-600'
                  }`}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : isListening ? (
                    <MicOff className="w-6 h-6" />
                  ) : (
                    <Mic className="w-6 h-6" />
                  )}
                </Button>
              </div>
              <p className="text-center text-sm text-gray-600 mt-2">
                {isProcessing ? 'Processing your reflection...' : 
                 isListening ? 'Speak freely about your week' : 
                 'Tap to start reflecting'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EnhancedMemoryManagerAgent