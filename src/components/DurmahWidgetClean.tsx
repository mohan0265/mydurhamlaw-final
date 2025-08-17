import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDurmah } from "@/context/DurmahContext";
import DurmahTranscriptModal from "./DurmahTranscriptModal";
import { useDurmahSpeech } from "@/lib/hooks/useDurmahSpeech";
import { useDurmahVoiceMode } from "@/lib/hooks/useDurmahVoiceMode";
import { Mic, X } from 'lucide-react';
import { DurmahIcon } from './ui/DurmahLogo';

const DurmahWidget: React.FC = () => {
  const {
    state,
    isOpen,
    openPanel,
    closePanel,
    isVoiceModeOpen,
    openVoiceMode,
    closeVoiceMode,
    displayMessages,
  } = useDurmah();

  // Voice mode functionality
  const voiceMode = useDurmahVoiceMode({
    onError: (error) => {
      console.error('[Durmah Widget] Voice mode error:', error);
    },
  });

  const startVoiceMode = useCallback(() => {
    console.log('[Durmah Widget] Starting voice mode');
    openVoiceMode();
    
    if (voiceMode.isSupported) {
      voiceMode.startVoiceConversation();
    }
  }, [openVoiceMode, voiceMode]);

  return (
    <div>
      {/* Branded Floating Widget */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-[9997]">
          <motion.button 
            onClick={openPanel}
            onDoubleClick={startVoiceMode}
            whileHover={{ scale: 1.05 }}
            className={`flex flex-col items-center justify-center p-4 min-w-[120px] min-h-[80px] rounded-2xl shadow-2xl text-white font-bold transition-all duration-300 ${
              state === "listening" 
                ? "bg-gradient-to-br from-green-500 to-emerald-600" 
                : state === "speaking"
                ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                : "bg-gradient-to-br from-purple-600 to-indigo-700"
            }`}
          >
            <DurmahIcon size="lg" className="mb-2" />
            <div className="text-xs text-center">
              <div>Durmah</div>
              <div className="text-white/80">Legal Voice Buddy</div>
            </div>
          </motion.button>
        </div>
      )}

      {/* Simple Voice Mode Overlay */}
      {isVoiceModeOpen && (
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900 to-indigo-900 z-[9999] flex items-center justify-center">
          <div className="text-white text-center">
            <div className="mb-8">
              <div className={`w-32 h-32 rounded-full mx-auto mb-4 flex items-center justify-center ${
                voiceMode.isListening 
                  ? "bg-green-500 animate-pulse" 
                  : voiceMode.isSpeaking 
                  ? "bg-blue-500 animate-pulse"
                  : "bg-purple-500"
              }`}>
                <div className="text-4xl font-bold">D</div>
              </div>
              <h1 className="text-4xl font-bold mb-2">Durmah</h1>
              <p className="text-xl mb-4">Your Legal Voice Buddy</p>
              <p className="text-lg">
                {voiceMode.isListening ? "I'm listening..." : 
                 voiceMode.isSpeaking ? "Speaking..." :
                 "Tap anywhere to speak"}
              </p>
            </div>
            <button 
              onClick={() => {
                voiceMode.stopVoiceConversation();
                closeVoiceMode();
              }}
              className="absolute top-8 right-8 p-3 bg-white/20 hover:bg-white/30 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Simple Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[9997] w-80 bg-white rounded-xl shadow-2xl">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <div className="font-bold">Durmah</div>
                <div className="text-sm opacity-90">Legal Voice Buddy</div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={startVoiceMode}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg"
                >
                  <Mic className="w-4 h-4 text-white" />
                </button>
                <button 
                  onClick={closePanel}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="text-center text-gray-600">
              <p>Voice mode available!</p>
              <p className="text-sm mt-2">Messages: {displayMessages.length}</p>
              <div className="mt-4 space-y-2">
                <button 
                  onClick={startVoiceMode}
                  className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700"
                >
                  Start Voice Mode
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transcript Modal */}
      <DurmahTranscriptModal />
    </div>
  );
};

export default DurmahWidget;