'use client'

import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface DurmahVoiceOverlayProps {
  isOpen: boolean
  isListening: boolean
  isSpeaking: boolean
  isProcessing: boolean
  onClose: () => void
  currentTranscript?: string
}

const DurmahVoiceOverlay: React.FC<DurmahVoiceOverlayProps> = ({
  isOpen,
  isListening,
  isSpeaking,
  isProcessing,
  onClose,
  currentTranscript = ''
}) => {
  const overlayRef = useRef<HTMLDivElement>(null)

  // Handle click anywhere to close
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Don't close if clicking on the close button specifically
      const target = e.target as HTMLElement
      if (target.closest('[data-close-button]')) {
        return
      }
      
      // Close on any other click
      if (isOpen && !isProcessing) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClick)
      // Prevent scroll
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('click', handleClick)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, isProcessing, onClose])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isProcessing) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, isProcessing, onClose])

  const getStateText = () => {
    if (isProcessing) return 'Thinking...'
    if (isSpeaking) return 'Speaking'
    if (isListening) return 'Listening'
    return 'Tap to speak with Durmah'
  }

  const getStateColor = () => {
    if (isProcessing) return 'from-amber-400 to-orange-500'
    if (isSpeaking) return 'from-blue-400 to-indigo-600'
    if (isListening) return 'from-green-400 to-emerald-600'
    return 'from-purple-500 to-indigo-600'
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900"
          style={{
            background: `
              radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 40% 80%, rgba(120, 200, 255, 0.3) 0%, transparent 50%),
              linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)
            `
          }}
        >
          {/* Close button */}
          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={onClose}
            data-close-button
            className="absolute top-8 right-8 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all duration-200 backdrop-blur-sm"
            aria-label="Close voice mode"
          >
            <X className="w-6 h-6" />
          </motion.button>

          {/* Main content container */}
          <div className="flex flex-col items-center justify-center min-h-screen px-8 py-16">
            
            {/* Animated sphere */}
            <div className="relative mb-16">
              {/* Main sphere */}
              <motion.div
                className={`w-64 h-64 rounded-full bg-gradient-to-br ${getStateColor()} shadow-2xl`}
                animate={
                  isListening
                    ? {
                        scale: [1, 1.05, 1],
                        boxShadow: [
                          '0 0 0 0 rgba(16, 185, 129, 0.4)',
                          '0 0 0 20px rgba(16, 185, 129, 0)',
                          '0 0 0 0 rgba(16, 185, 129, 0)',
                        ],
                      }
                    : isSpeaking
                    ? {
                        scale: [1, 1.02, 1.01, 1],
                        filter: ['brightness(1)', 'brightness(1.2)', 'brightness(1)'],
                      }
                    : isProcessing
                    ? {
                        rotate: [0, 360],
                        scale: [1, 1.02, 1],
                      }
                    : {
                        scale: 1,
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                      }
                }
                transition={{
                  duration: isListening ? 2 : isSpeaking ? 1.5 : isProcessing ? 2 : 0.5,
                  repeat: isListening || isSpeaking || isProcessing ? Infinity : 0,
                  ease: isProcessing ? 'linear' : 'easeInOut',
                }}
              />

              {/* Outer ripple effect for listening */}
              {isListening && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-green-400/30"
                  animate={{
                    scale: [1, 2.5],
                    opacity: [1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                />
              )}

              {/* Inner glow for speaking */}
              {isSpeaking && (
                <>
                  <motion.div
                    className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-300/20 to-indigo-500/20"
                    animate={{
                      opacity: [0.5, 1, 0.5],
                      scale: [0.9, 1, 0.9],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                  <motion.div
                    className="absolute inset-8 rounded-full bg-gradient-to-br from-blue-200/30 to-indigo-400/30"
                    animate={{
                      opacity: [0.3, 0.7, 0.3],
                      scale: [0.8, 1, 0.8],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: 0.3,
                    }}
                  />
                </>
              )}

              {/* Processing indicator */}
              {isProcessing && (
                <div className="absolute inset-0 rounded-full">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute inset-0 rounded-full border-t-2 border-amber-400"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 2 - i * 0.3,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                      style={{
                        transformOrigin: 'center',
                        margin: `${i * 20}px`,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Durmah logo/icon in center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                  animate={isSpeaking ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1, repeat: isSpeaking ? Infinity : 0 }}
                >
                  <div className="text-white text-2xl font-bold">D</div>
                </motion.div>
              </div>
            </div>

            {/* Status text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-8"
            >
              <h1 className="text-4xl font-bold text-white mb-4">
                {getStateText()}
              </h1>
              
              {/* Current transcript display */}
              {currentTranscript && isListening && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-2xl mx-auto"
                >
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                    <p className="text-lg text-white/90 leading-relaxed">
                      &ldquo;{currentTranscript}&rdquo;
                    </p>
                  </div>
                </motion.div>
              )}
              
              {/* Instructions */}
              {!isProcessing && !isSpeaking && !isListening && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-xl text-white/70"
                >
                  Tap anywhere to start speaking
                </motion.p>
              )}

              {isListening && !currentTranscript && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-lg text-white/70"
                >
                  I&apos;m listening...
                </motion.p>
              )}
            </motion.div>

            {/* Durmah branding */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            >
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Durmah
                </h2>
                <p className="text-white/60 text-sm">
                  Your Legal Voice Buddy
                </p>
              </div>
            </motion.div>

            {/* Subtle hint for mobile users */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 2, duration: 1 }}
              className="absolute bottom-32 left-1/2 transform -translate-x-1/2 text-center"
            >
              <p className="text-white/40 text-xs">
                Tap anywhere to end conversation
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default DurmahVoiceOverlay