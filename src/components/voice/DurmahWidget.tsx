/**
 * Durmah Voice Widget - Continuous Loop Mode
 * Auto-start listening, pulsing glow, barge-in functionality
 * Transcript only shown after "End Chat"
 */

import React, { useState, useEffect } from 'react';
import { useDurmahVoice } from '../../hooks/useDurmahVoice';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { DurmahLogo } from '../ui/DurmahLogo';
import { TranscriptModal } from './TranscriptModal';
import { VoiceMessage } from '../../lib/voice/supabaseStore';
import { Mic } from 'lucide-react';

interface DurmahWidgetProps {
  isVisible?: boolean;
  onToggle?: (visible: boolean) => void;
}

export function DurmahWidget({ isVisible = true, onToggle }: DurmahWidgetProps) {
  const {
    status,
    isRecording,
    error,
    sessionId,
    audioLevel,
    isContinuous,
    startContinuous,
    stopContinuous,
    bargeIn,
    endChat
  } = useDurmahVoice();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcriptData, setTranscriptData] = useState<{
    sessionId: string | null;
    messages: VoiceMessage[];
  } | null>(null);

  const getStatusColor = () => {
    switch (status) {
      case 'listening': return 'border-blue-500 shadow-blue-500/20';
      case 'processing': return 'border-yellow-500 shadow-yellow-500/20';
      case 'thinking': return 'border-purple-500 shadow-purple-500/20';
      case 'speaking': return 'border-green-500 shadow-green-500/20';
      case 'error': return 'border-red-500 shadow-red-500/20';
      default: return 'border-gray-400 shadow-gray-400/20';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'listening': return 'Listening...';
      case 'processing': return 'Processing...';
      case 'thinking': return 'Thinking...';
      case 'speaking': return 'Speaking...';
      case 'error': return 'Error';
      default: return 'Ready';
    }
  };

  // Auto-start continuous mode when widget opens
  useEffect(() => {
    if (isVisible && isExpanded && !isContinuous) {
      console.log('DURMAH_UI_AUTO_START_CONTINUOUS');
      startContinuous();
    }
    
    return () => {
      if (isVisible && !isExpanded && isContinuous) {
        console.log('DURMAH_UI_AUTO_STOP_CONTINUOUS');
        stopContinuous();
      }
    };
  }, [isVisible, isExpanded, isContinuous, startContinuous, stopContinuous]);

  if (!isVisible) return null;

  const handleMicClick = () => {
    if (status === 'speaking') {
      console.log('DURMAH_UI_BARGE_IN');
      bargeIn();
    }
    // In continuous mode, mic button is mainly for barge-in during speaking
  };

  const handleEndChat = () => {
    console.log('DURMAH_UI_END_CHAT');
    const sessionData = endChat();
    
    // Set transcript data and show modal
    setTranscriptData(sessionData);
    setShowTranscript(true);
    setIsExpanded(false);
  };

  return (
    <>
      {/* Continuous Voice Loop Widget */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-3">
        {/* Continuous Voice Panel */}
        {isExpanded && (
          <Card className="w-[320px] bg-white/95 backdrop-blur-sm border shadow-2xl rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-b">
              <div className="flex items-center space-x-2">
                <DurmahLogo className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-gray-900">Durmah</span>
                <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
                <span className="text-sm text-gray-600">{getStatusText()}</span>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mx-4 mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                <div className="font-medium">Error:</div>
                <div>{error}</div>
              </div>
            )}

            {/* Main Continuous Voice Area */}
            <div className="flex flex-col items-center py-8 px-6">
              {/* Circular Mic Button with Animations */}
              <div className="relative">
                {/* Pulsing Glow for Listening */}
                {status === 'listening' && (
                  <div className="absolute inset-0 w-20 h-20 rounded-full bg-blue-500/20 animate-[pulseRing_1.6s_ease-out_infinite]" />
                )}
                
                {/* Mic Button */}
                <Button
                  onClick={handleMicClick}
                  className={`relative w-20 h-20 rounded-full ${
                    status === 'listening' ? 'bg-blue-500 hover:bg-blue-600' :
                    status === 'processing' ? 'bg-yellow-500' :
                    status === 'thinking' ? 'bg-purple-500' :
                    status === 'speaking' ? 'bg-green-500 hover:bg-green-600' :
                    status === 'error' ? 'bg-red-500 hover:bg-red-600' :
                    'bg-gray-500'
                  } shadow-xl border-4 border-white/50 transition-all duration-300`}
                >
                  {status === 'speaking' ? (
                    /* EQ Bars Animation when speaking */
                    <div className="flex items-center justify-center space-x-1">
                      <div className="w-1 bg-white rounded-full animate-[speakBars_0.9s_ease-in-out_infinite] h-3" style={{ animationDelay: '0ms' }} />
                      <div className="w-1 bg-white rounded-full animate-[speakBars_0.9s_ease-in-out_infinite] h-5" style={{ animationDelay: '150ms' }} />
                      <div className="w-1 bg-white rounded-full animate-[speakBars_0.9s_ease-in-out_infinite] h-2" style={{ animationDelay: '300ms' }} />
                    </div>
                  ) : status === 'thinking' ? (
                    /* Spinner dots for thinking */
                    <div className="flex items-center justify-center space-x-1">
                      <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  ) : (
                    <Mic className="w-6 h-6 text-white" />
                  )}
                </Button>

                {/* Audio Level Indicator for listening */}
                {status === 'listening' && audioLevel > 0 && (
                  <div 
                    className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-blue-200 rounded-full overflow-hidden"
                  >
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-100"
                      style={{ width: `${Math.min(audioLevel * 500, 100)}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Helper Text */}
              <p className="mt-4 text-sm text-gray-500 text-center max-w-64">
                {status === 'listening' ? 'Listening... Speak naturally' :
                 status === 'processing' ? 'Processing your voice...' :
                 status === 'thinking' ? 'Durmah is thinking...' :
                 status === 'speaking' ? 'Tap mic to interrupt' :
                 status === 'error' ? 'Error - please try again' :
                 'Starting continuous voice mode...'}
              </p>

              {/* Session Status */}
              {sessionId && (
                <p className="mt-2 text-xs text-gray-400 text-center">
                  Session: {sessionId.slice(-8)}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-center p-4 bg-gray-50 border-t">
              <Button
                onClick={handleEndChat}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                End Chat
              </Button>
            </div>
          </Card>
        )}

        {/* Status-aware FAB with pulsing */}
        <div className="relative">
          {/* Pulse Ring for Listening */}
          {status === 'listening' && !isExpanded && (
            <div className="absolute inset-0 w-14 h-14 rounded-full bg-blue-500/30 animate-[pulseRing_1.6s_ease-out_infinite]" />
          )}
          
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`relative w-14 h-14 rounded-full ${
              status === 'listening' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
              status === 'processing' ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' :
              status === 'thinking' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
              status === 'speaking' ? 'bg-gradient-to-br from-green-500 to-green-600' :
              status === 'error' ? 'bg-gradient-to-br from-red-500 to-red-600' :
              'bg-gradient-to-br from-purple-500 to-purple-600'
            } hover:scale-105 shadow-xl border-2 border-white/50 transition-all duration-300`}
          >
            <DurmahLogo className="w-6 h-6 text-white" />
          </Button>

          {/* Status Indicators */}
          {isContinuous && !isExpanded && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-pulse border-2 border-white" />
          )}
        </div>
      </div>

      {/* Transcript Modal - Only opens after End Chat */}
      {transcriptData && (
        <TranscriptModal
          sessionId={transcriptData.sessionId}
          messages={transcriptData.messages}
          isOpen={showTranscript}
          onClose={() => {
            setShowTranscript(false);
            setTranscriptData(null);
          }}
        />
      )}
    </>
  );
}

