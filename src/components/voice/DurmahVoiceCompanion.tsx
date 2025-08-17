'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Volume2, VolumeX, MessageSquare, X, Settings, Maximize2, Minimize2 } from 'lucide-react'
import { useAuth } from '@/lib/supabase/AuthContext'
import { useDurmahVoiceSession } from '@/lib/hooks/useDurmahVoiceSession'
import { DurmahIcon } from '@/components/ui/DurmahLogo'
import { cn } from '@/lib/utils'

interface DurmahVoiceCompanionProps {
  className?: string
}

export const DurmahVoiceCompanion: React.FC<DurmahVoiceCompanionProps> = ({ 
  className = '' 
}) => {
  const { user } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isMobile, setIsMobile] = useState(false)
  const widgetRef = useRef<HTMLDivElement>(null)
  
  const {
    isActive,
    isListening,
    isSpeaking,
    isProcessing,
    transcript,
    error,
    startSession,
    stopSession,
    clearError,
    volume
  } = useDurmahVoiceSession()

  // Responsive detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load saved position and state
  useEffect(() => {
    const saved = localStorage.getItem('durmah_voice_position')
    if (saved) {
      const data = JSON.parse(saved)
      setPosition(data.position || { x: 0, y: 0 })
      setIsExpanded(data.isExpanded || false)
    }
  }, [])

  // Save position and state
  const saveState = useCallback((newPosition?: { x: number; y: number }, newExpanded?: boolean) => {
    const state = {
      position: newPosition || position,
      isExpanded: newExpanded !== undefined ? newExpanded : isExpanded
    }
    localStorage.setItem('durmah_voice_position', JSON.stringify(state))
  }, [position, isExpanded])

  const handleToggleSession = useCallback(() => {
    if (!user) {
      alert('Please sign in to use Durmah voice companion.')
      return
    }
    
    if (isActive) {
      stopSession()
      if (transcript.length > 0) {
        setShowTranscript(true)
      }
    } else {
      startSession()
      setIsExpanded(true)
      saveState(undefined, true)
    }
  }, [user, isActive, stopSession, startSession, transcript, saveState])

  const handleMinimize = useCallback(() => {
    setIsExpanded(false)
    saveState(undefined, false)
  }, [saveState])

  const handleExpand = useCallback(() => {
    setIsExpanded(true)
    saveState(undefined, true)
  }, [saveState])

  // Get current state for display
  const getStatusText = () => {
    if (error) return 'Error - Tap to retry'
    if (!isActive) return 'Tap to start'
    if (isProcessing) return 'Thinking...'
    if (isSpeaking) return 'Speaking...'
    if (isListening) return 'Listening...'
    return 'Ready'
  }

  const getStatusColor = () => {
    if (error) return 'from-red-500 to-red-600'
    if (!isActive) return 'from-purple-600 to-indigo-700'
    if (isProcessing) return 'from-yellow-500 to-orange-600'
    if (isSpeaking) return 'from-blue-500 to-indigo-600'
    if (isListening) return 'from-green-500 to-emerald-600'
    return 'from-purple-600 to-indigo-700'
  }

  // Floating widget positioning
  const getFloatingPosition = () => {
    if (isMobile) {
      return 'fixed bottom-4 right-4'
    } else {
      return 'fixed top-4 right-4'
    }
  }

  if (!user) {
    return (
      <div className={cn(
        getFloatingPosition(),
        'z-[9998] hidden', // Hidden when logged out
        className
      )}>
        {/* Widget hidden when not authenticated */}
      </div>
    )
  }

  return (
    <>
      {/* Main Floating Widget */}
      <motion.div
        ref={widgetRef}
        className={cn(
          getFloatingPosition(),
          'z-[9998]',
          className
        )}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              key="expanded"
              initial={{ width: 80, height: 80 }}
              animate={{ width: 320, height: 400 }}
              exit={{ width: 80, height: 80 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className={cn(
                'bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200/50',
                'flex flex-col overflow-hidden'
              )}
            >
              {/* Header */}
              <div className={cn(
                'bg-gradient-to-r',
                getStatusColor(),
                'p-4 text-white'
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DurmahIcon size="sm" className="text-white" />
                    <div>
                      <div className="font-semibold text-sm">Durmah</div>
                      <div className="text-xs opacity-90">{getStatusText()}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={handleMinimize}
                      className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                      title="Minimize"
                    >
                      <Minimize2 size={16} />
                    </button>
                    <button
                      onClick={() => {
                        stopSession()
                        setIsExpanded(false)
                      }}
                      className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                      title="Close"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 p-4 flex flex-col">
                {/* Visual Feedback */}
                <div className="flex-1 flex items-center justify-center">
                  <div className={cn(
                    'w-24 h-24 rounded-full border-4 flex items-center justify-center',
                    'transition-all duration-300',
                    isListening ? 'border-green-400 bg-green-50' :
                    isSpeaking ? 'border-blue-400 bg-blue-50' :
                    isProcessing ? 'border-yellow-400 bg-yellow-50' :
                    'border-gray-300 bg-gray-50'
                  )}>
                    {isListening ? (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        <Mic className="text-green-600" size={32} />
                      </motion.div>
                    ) : isSpeaking ? (
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                      >
                        <Volume2 className="text-blue-600" size={32} />
                      </motion.div>
                    ) : (
                      <DurmahIcon size="lg" className="text-gray-600" />
                    )}
                  </div>
                </div>

                {/* Volume Indicator */}
                {isListening && volume > 0 && (
                  <div className="mb-4">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-400 transition-all duration-100"
                        style={{ width: `${Math.min(100, volume * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-red-800 text-sm font-medium mb-1">Connection Issue</div>
                    <div className="text-red-600 text-xs">{error}</div>
                    <button
                      onClick={clearError}
                      className="mt-2 text-red-600 hover:text-red-800 text-xs underline"
                    >
                      Try again
                    </button>
                  </div>
                )}

                {/* Controls */}
                <div className="flex items-center justify-center space-x-3">
                  <button
                    onClick={handleToggleSession}
                    disabled={isProcessing}
                    className={cn(
                      'p-3 rounded-full transition-all duration-200',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      isActive ? 
                        'bg-red-500 hover:bg-red-600 text-white' :
                        'bg-green-500 hover:bg-green-600 text-white'
                    )}
                    title={isActive ? 'End Session' : 'Start Session'}
                  >
                    {isActive ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>
                  
                  {transcript.length > 0 && (
                    <button
                      onClick={() => setShowTranscript(true)}
                      className="p-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                      title="View Transcript"
                    >
                      <MessageSquare size={20} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="collapsed"
              onClick={isActive ? handleExpand : handleToggleSession}
              initial={{ width: 320, height: 400 }}
              animate={{ width: 80, height: 80 }}
              exit={{ width: 320, height: 400 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className={cn(
                'bg-gradient-to-br',
                getStatusColor(),
                'rounded-full shadow-2xl text-white',
                'flex items-center justify-center',
                'hover:scale-105 transition-transform duration-200',
                'relative overflow-hidden'
              )}
              title={isActive ? 'Expand Durmah' : 'Start Durmah Voice Companion'}
            >
              {/* Pulsing effect when active */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 bg-white/20 rounded-full"
                  animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 0, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              )}
              
              <div className="flex flex-col items-center">
                {isActive ? (
                  isListening ? (
                    <motion.div
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      <Mic size={24} />
                    </motion.div>
                  ) : isSpeaking ? (
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    >
                      <Volume2 size={24} />
                    </motion.div>
                  ) : (
                    <DurmahIcon size="md" />
                  )
                ) : (
                  <DurmahIcon size="md" />
                )}
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Transcript Modal */}
      {showTranscript && (
        <DurmahTranscriptDrawer
          transcript={transcript}
          isOpen={showTranscript}
          onClose={() => setShowTranscript(false)}
        />
      )}
    </>
  )
}

// Transcript Drawer Component
interface DurmahTranscriptDrawerProps {
  transcript: Array<{ role: 'user' | 'assistant'; content: string; timestamp: number }>
  isOpen: boolean
  onClose: () => void
}

const DurmahTranscriptDrawer: React.FC<DurmahTranscriptDrawerProps> = ({
  transcript,
  isOpen,
  onClose
}) => {
  const [isSaving, setIsSaving] = useState(false)
  const { user } = useAuth()

  const handleSave = async () => {
    if (!user || !transcript.length) return
    
    setIsSaving(true)
    try {
      const response = await fetch('/api/durmah/save-transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          transcript,
          timestamp: Date.now()
        })
      })
      
      if (response.ok) {
        alert('Transcript saved successfully!')
        onClose()
      } else {
        throw new Error('Failed to save transcript')
      }
    } catch (error) {
      console.error('Error saving transcript:', error)
      alert('Failed to save transcript. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this transcript?')) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-end md:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Conversation Transcript</h2>
            <p className="text-sm text-gray-500 mt-1">
              {transcript.length} messages • {new Date().toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Transcript Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {transcript.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No conversation yet</p>
            </div>
          ) : (
            transcript.map((message, index) => (
              <div
                key={index}
                className={cn(
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[80%] p-3 rounded-2xl',
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  )}
                >
                  <div className="text-sm">{message.content}</div>
                  <div className={cn(
                    'text-xs mt-1 opacity-70',
                    message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                  )}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 flex justify-between">
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-red-600 hover:text-red-800 font-medium transition-colors"
          >
            Delete
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || transcript.length === 0}
              className={cn(
                'px-6 py-2 rounded-lg font-medium transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'bg-blue-500 hover:bg-blue-600 text-white'
              )}
            >
              {isSaving ? 'Saving...' : 'Save Transcript'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default DurmahVoiceCompanion